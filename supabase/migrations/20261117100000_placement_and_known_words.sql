-- ============================================
-- Giriş testi ("bildiklerini atla") + hata defteri
--
-- placement_done_at: kullanıcı giriş testini bitirdi/atladı mı. Boşsa
-- uygulama açılışta testi gösterir. Mevcut kullanıcılara test sorulmaz.
--
-- mark_words_known: testte doğru bilinen kelimeleri kullanıcının havuzuna
-- "zaten biliyor" olarak ekler — günlük hak harcanmaz, yeni kelime diye
-- bir daha gelmez, 14 gün sonra bir kez tekrar sorulur (doğruysa aralık
-- SM-2 ile büyür, yanlışsa normal tekrara döner).
-- ============================================

alter table en_users add column if not exists placement_done_at timestamptz;

update en_users set placement_done_at = now() where placement_done_at is null;

grant update (placement_done_at) on en_users to authenticated;

create or replace function mark_words_known(p_ids uuid[])
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_added int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into en_user_words (user_id, word_id, added_at, next_review_at, last_reviewed_at,
                             review_count, ease_factor, mastery_level, is_mastered,
                             total_correct, total_wrong, last_score)
  select v_uid, w.id, now(), now() + interval '14 days', now(),
         2, 2.5, 3, false, 1, 0, 100
    from en_words w
   where w.id = any(p_ids[1:50])
     and not exists (select 1 from en_user_words uw where uw.user_id = v_uid and uw.word_id = w.id);
  get diagnostics v_added = row_count;

  return v_added;
end;
$$;

revoke all on function mark_words_known(uuid[]) from public, anon;
grant execute on function mark_words_known(uuid[]) to authenticated;
