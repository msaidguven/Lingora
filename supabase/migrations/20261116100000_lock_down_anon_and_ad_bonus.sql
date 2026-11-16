-- anon (giriş yapmamış) rolü en_users'ı güncelleyemez.
revoke update on en_users from anon;

-- Reklam ödülü yalnızca giriş yapmış kullanıcının KENDİ hesabına verilebilir.
create or replace function grant_ad_bonus(p_user_id uuid, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not allowed';
  end if;

  if p_kind = 'word' then
    update public.en_users
       set bonus_words_today = bonus_words_today + 5,
           ads_watched_today = ads_watched_today + 1,
           total_ads_watched = total_ads_watched + 1,
           last_ad_watch_at = now()
     where id = p_user_id;
  elsif p_kind = 'sentence' then
    update public.en_users
       set bonus_sentences_today = bonus_sentences_today + 5,
           ads_watched_today = ads_watched_today + 1,
           total_ads_watched = total_ads_watched + 1,
           last_ad_watch_at = now()
     where id = p_user_id;
  else
    raise exception 'Geçersiz kind: %', p_kind;
  end if;
end;
$$;

revoke all on function grant_ad_bonus(uuid, text) from public, anon;
grant execute on function grant_ad_bonus(uuid, text) to authenticated;
