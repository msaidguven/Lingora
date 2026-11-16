-- Google Play kuralı: kullanıcı hesabını ve verilerini uygulama içinden silebilmeli.
-- İki işlem var, ikisi de yalnızca giriş yapmış kullanıcının KENDİ verisine dokunur.

-- Öğrenme ilerlemesini siler, hesabı korur. Günlük kota alanlarına dokunmaz
-- (sıfırlama yeni kota kazandırmasın).
create or replace function reset_my_progress()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not allowed';
  end if;

  delete from en_user_quiz_attempts   where user_id = uid;
  delete from en_user_words           where user_id = uid;
  delete from en_user_sentences       where user_id = uid;
  delete from en_user_lesson_progress where user_id = uid;
  delete from en_user_daily_stats     where user_id = uid;
  delete from en_user_stats           where user_id = uid;

  update en_users
     set level = 'A1',
         total_points = 0,
         streak_days = 0,
         updated_at = now()
   where id = uid;
end;
$$;

-- Hesabı ve bütün kişisel verileri kalıcı olarak siler (giriş bilgisi dahil).
-- Gönderilen kelime geri bildirimleri içerik olarak kalır ama kimlikten ayrılır.
create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not allowed';
  end if;

  delete from en_user_quiz_attempts   where user_id = uid;
  delete from en_user_words           where user_id = uid;
  delete from en_user_sentences       where user_id = uid;
  delete from en_user_lesson_progress where user_id = uid;
  delete from en_user_daily_stats     where user_id = uid;
  delete from en_user_stats           where user_id = uid;
  update word_feedback set user_id = null, user_email = null where user_id = uid;
  delete from en_users                where id = uid;
  delete from auth.users              where id = uid;
end;
$$;

revoke all on function reset_my_progress() from public, anon;
revoke all on function delete_my_account() from public, anon;
grant execute on function reset_my_progress() to authenticated;
grant execute on function delete_my_account() to authenticated;

notify pgrst, 'reload schema';
