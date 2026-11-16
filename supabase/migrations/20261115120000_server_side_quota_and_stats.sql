-- ============================================
-- Günlük hakkı ve istatistiği SUNUCUDA yönet.
-- Amaç: kayıt ekleme + kota artırma tek işlemde (atomik), istemci kota/coin
-- değerini doğrudan yazamasın, istatistik sayaçları yarışsız artsın.
--
-- ÖNCE ÇALIŞTIR (Supabase → SQL Editor, lingora projesi), SONRA uygulamayı
-- yeni sürümle yükle. İstemci kodu bu fonksiyonları çağıracak şekilde
-- güncellendiğinde bu migration olmadan yeni/açılan hak alınamaz.
-- ============================================

-- 1) Yeni kelime/cümle al: kalan hakkı sunucu hesaplar, kayıtları ekler,
--    kotayı aynı işlemde artırır. Eklenen sayıyı döndürür.
create or replace function claim_new_items(p_kind text, p_ids uuid[])
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_quota int;
  v_used int;
  v_bonus int;
  v_remaining int;
  v_ids uuid[];
  v_added int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_kind not in ('word', 'sentence') then
    raise exception 'invalid kind';
  end if;

  -- Yeni gün ise sayaçları sıfırla (mevcut idempotent fonksiyon)
  perform reset_daily_quota_if_needed(v_uid);

  -- Satırı kilitle: çift dokunuş / iki cihaz aynı anda hak harcayamaz
  if p_kind = 'word' then
    select daily_word_quota, daily_word_quota_used, bonus_words_today
      into v_quota, v_used, v_bonus
      from en_users where id = v_uid for update;
  else
    select daily_sentence_quota, daily_sentence_quota_used, bonus_sentences_today
      into v_quota, v_used, v_bonus
      from en_users where id = v_uid for update;
  end if;

  v_remaining := greatest(0, coalesce(v_quota, 0) + coalesce(v_bonus, 0) - coalesce(v_used, 0));
  if v_remaining = 0 then
    return 0;
  end if;

  v_ids := p_ids[1:v_remaining];  -- hakkı aşan kısım kesilir

  if p_kind = 'word' then
    insert into en_user_words (user_id, word_id, added_at, next_review_at, review_count,
                               ease_factor, mastery_level, is_mastered)
    select v_uid, w.id, now(), now(), 0, 2.5, 0, false
      from en_words w
     where w.id = any(v_ids)
       and not exists (select 1 from en_user_words uw where uw.user_id = v_uid and uw.word_id = w.id);
    get diagnostics v_added = row_count;

    update en_users set daily_word_quota_used = coalesce(daily_word_quota_used, 0) + v_added
     where id = v_uid;
  else
    insert into en_user_sentences (user_id, sentence_id, added_at, next_review_at, review_count, ease_factor)
    select v_uid, s.id, now(), now(), 0, 2.5
      from en_example_sentences s
     where s.id = any(v_ids)
       and s.is_approved = true
       and not exists (select 1 from en_user_sentences us where us.user_id = v_uid and us.sentence_id = s.id);
    get diagnostics v_added = row_count;

    update en_users set daily_sentence_quota_used = coalesce(daily_sentence_quota_used, 0) + v_added
     where id = v_uid;
  end if;

  return v_added;
end;
$$;

revoke all on function claim_new_items(text, uuid[]) from public, anon;
grant execute on function claim_new_items(text, uuid[]) to authenticated;

-- 2) Günlük istatistik: oku-hesapla-yaz yerine tek atomik upsert.
--    (user_id, stat_date) üzerindeki mevcut unique kısıta dayanır
--    (istemci de aynı onConflict ile upsert ediyordu).
create or replace function bump_daily_stat(p_type text, p_correct boolean, p_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  wc int := (p_type = 'word' and p_correct)::int;
  ww int := (p_type = 'word' and not p_correct)::int;
  sc int := (p_type = 'sentence' and p_correct)::int;
  sw int := (p_type = 'sentence' and not p_correct)::int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_type not in ('word', 'sentence') then
    raise exception 'invalid type';
  end if;

  insert into en_user_daily_stats as d
    (user_id, stat_date, word_correct, word_wrong, sentence_correct, sentence_wrong,
     total_correct, total_wrong, total_attempts, accuracy, updated_at)
  values
    (v_uid, p_date, wc, ww, sc, sw, wc + sc, ww + sw, wc + sc + ww + sw,
     case when wc + sc + ww + sw > 0 then round((wc + sc)::numeric * 100 / (wc + sc + ww + sw), 2) else 0 end,
     now())
  on conflict (user_id, stat_date) do update set
    word_correct     = d.word_correct + wc,
    word_wrong       = d.word_wrong + ww,
    sentence_correct = d.sentence_correct + sc,
    sentence_wrong   = d.sentence_wrong + sw,
    total_correct    = d.total_correct + wc + sc,
    total_wrong      = d.total_wrong + ww + sw,
    total_attempts   = d.total_attempts + wc + sc + ww + sw,
    accuracy         = round((d.total_correct + wc + sc)::numeric * 100
                       / nullif(d.total_attempts + wc + sc + ww + sw, 0), 2),
    updated_at       = now();
end;
$$;

revoke all on function bump_daily_stat(text, boolean, date) from public, anon;
grant execute on function bump_daily_stat(text, boolean, date) to authenticated;

-- 3) İstemci kota/coin kolonlarını doğrudan yazamasın (RLS satır bazlıdır,
--    kolon kısıtı için kolon yetkisi gerekir). Kalan kolonlar yazılabilir.
revoke update on en_users from authenticated;
grant update (username, avatar_url, level, last_active_at, updated_at) on en_users to authenticated;
