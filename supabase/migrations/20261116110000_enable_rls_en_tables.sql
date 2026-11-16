-- ============================================
-- RLS tüm en_* tablolarında KAPALIYDI: anon anahtarıyla herkes herkesin verisini
-- okuyup yazabiliyordu. Politikalar vardı ama uygulanmıyordu. Burada:
--  1) en_users'taki kendi tablosunu sorgulayan (özyinelemeli) admin
--     politikaları security definer is_admin() ile değiştirilir,
--  2) en_example_sentences'e eksik politikalar eklenir,
--  3) en_users INSERT yalnız role='user' ile ve belirli kolonlarla yapılabilir,
--  4) anon'dan gereksiz yetkiler alınır,
--  5) RLS açılır.
-- ============================================

create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from en_users where id = auth.uid() and role = 'admin');
$$;
revoke all on function is_admin() from public, anon;
grant execute on function is_admin() to authenticated;

-- 1) en_users politikaları
drop policy if exists "Admins can view all users" on en_users;
drop policy if exists "Admins can update all users" on en_users;
create policy "Admins can view all users" on en_users for select to authenticated using (is_admin());
create policy "Admins can update all users" on en_users for update to authenticated using (is_admin());

-- 3) Kayıt: kendi satırını yalnız role='user' ile ekleyebilir
drop policy if exists "Users can insert their own data" on en_users;
drop policy if exists "en_users_insert" on en_users;
create policy "en_users_insert" on en_users for insert to authenticated
  with check (auth.uid() = id and role = 'user');

revoke insert on en_users from authenticated;
grant insert (id, email, username, avatar_url, level, role, streak_days, created_at)
  on en_users to authenticated;

-- 2) en_example_sentences eksik politikaları (en_words ile aynı mantık)
create policy "en_example_sentences_select" on en_example_sentences for select using (true);
create policy "en_example_sentences_insert" on en_example_sentences for insert to authenticated
  with check (auth.uid() in (select id from en_users where role in ('admin', 'editor')));
create policy "en_example_sentences_update" on en_example_sentences for update to authenticated
  using (auth.uid() in (select id from en_users where role in ('admin', 'editor')));
create policy "en_example_sentences_delete" on en_example_sentences for delete to authenticated
  using (auth.uid() in (select id from en_users where role in ('admin', 'editor')));

-- 4) Yetki temizliği: anon yalnız içerik tablolarını okuyabilir; hiçbir rol
--    TRUNCATE/TRIGGER/REFERENCES kullanamaz (RLS bunları kapsamaz).
revoke all on en_users, en_user_words, en_user_sentences, en_user_daily_stats,
  en_user_stats, en_user_lesson_progress, en_user_quiz_attempts from anon;
revoke insert, update, delete on en_words, en_lessons, en_lesson_words,
  en_quiz_questions, en_example_sentences from anon;
revoke truncate, trigger, references on en_users, en_user_words, en_user_sentences,
  en_user_daily_stats, en_user_stats, en_user_lesson_progress, en_user_quiz_attempts,
  en_words, en_lessons, en_lesson_words, en_quiz_questions, en_example_sentences
  from anon, authenticated;

-- 5) RLS aç
alter table en_users enable row level security;
alter table en_words enable row level security;
alter table en_lessons enable row level security;
alter table en_lesson_words enable row level security;
alter table en_quiz_questions enable row level security;
alter table en_example_sentences enable row level security;
alter table en_user_words enable row level security;
alter table en_user_sentences enable row level security;
alter table en_user_daily_stats enable row level security;
alter table en_user_stats enable row level security;
alter table en_user_lesson_progress enable row level security;
alter table en_user_quiz_attempts enable row level security;
