-- Seri (streak): streak_days alanı vardı ama hiçbir yerde güncellenmiyordu (herkes 0).
-- Artık her çalışma kaydında (bump_daily_stat) sunucuda hesaplanıyor:
--   * aynı gün tekrar çalışma: seri değişmez
--   * dün çalışmışsa: +1
--   * tek gün kaçırılmış ve dondurma hakkı varsa: hak harcanır, seri +1 (bozulmaz)
--   * aksi halde seri 1'den yeniden başlar
--   * her 7 günlük seride 1 dondurma hakkı kazanılır (en fazla 2)

alter table en_users add column if not exists streak_last_date date;
alter table en_users add column if not exists streak_freezes int not null default 0;

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
  v_streak int;
  v_last date;
  v_freezes int;
  v_new int;
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

  -- Seri
  select coalesce(streak_days, 0), streak_last_date, coalesce(streak_freezes, 0)
    into v_streak, v_last, v_freezes
    from en_users where id = v_uid for update;
  if not found then
    return;
  end if;

  if v_last is not null and p_date <= v_last then
    return; -- bugün zaten sayıldı (ya da geçmiş tarihli kayıt)
  end if;

  if v_last = p_date - 1 then
    v_new := v_streak + 1;
  elsif v_last = p_date - 2 and v_freezes > 0 then
    v_new := v_streak + 1;
    v_freezes := v_freezes - 1;
  else
    v_new := 1;
  end if;

  if v_new % 7 = 0 then
    v_freezes := least(v_freezes + 1, 2);
  end if;

  update en_users
     set streak_days = v_new,
         streak_last_date = p_date,
         streak_freezes = v_freezes,
         last_active_at = now()
   where id = v_uid;
end;
$$;

-- Mevcut kullanıcılar: son çalışma gününe kadar kesintisiz gün sayısı.
with days as (
  select user_id, stat_date
    from en_user_daily_stats
   where coalesce(total_attempts, 0) > 0
   group by user_id, stat_date
), grp as (
  select user_id, stat_date,
         stat_date - (row_number() over (partition by user_id order by stat_date))::int as g
    from days
), runs as (
  select user_id, max(stat_date) as last_day, count(*)::int as len,
         row_number() over (partition by user_id order by max(stat_date) desc) as rn
    from grp group by user_id, g
)
update en_users u
   set streak_days = r.len,
       streak_last_date = r.last_day,
       streak_freezes = least(r.len / 7, 2)
  from runs r
 where r.user_id = u.id and r.rn = 1;

notify pgrst, 'reload schema';
