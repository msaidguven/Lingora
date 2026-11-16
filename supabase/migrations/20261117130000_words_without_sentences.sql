-- Kelime listeleri (Oxford PDF) toplu yüklenip cümleleri sonradan AI ile eklenir.

-- 1) Admin paneli: bir seviyede henüz cümlesi olmayan kelimeler (alfabetik) + toplam sayı.
create or replace function words_without_sentences(p_level text, p_limit int default 5)
returns table (id uuid, word text, meaning text, total bigint)
language sql
stable
set search_path = public
as $$
  select w.id, w.word, w.meaning, count(*) over () as total
    from en_words w
   where w.level = p_level
     and not exists (select 1 from en_example_sentences s where s.word_id = w.id)
   order by lower(w.word)
   limit p_limit;
$$;

revoke all on function words_without_sentences(text, int) from public, anon;
grant execute on function words_without_sentences(text, int) to authenticated;

-- 2) Admin promptu C1'i de sunuyor; tablo kısıtı izin versin.
alter table en_words drop constraint if exists en_words_level_check;
alter table en_words add constraint en_words_level_check
  check (level = any (array['A1', 'A2', 'B1', 'B2', 'C1']));

-- 3) Öğrenciye yalnız hazır kelimeler gelsin: listeden gelen ham (sözlük) anlamlı,
--    cümlesi henüz eklenmemiş kelimeler yeni kelime / giriş testi olarak sunulmaz.
create or replace function get_new_words(
  p_user_id uuid,
  p_level text,
  p_limit int default 5
)
returns setof en_words
language sql
security definer
set search_path = public
as $$
  select w.*
  from en_words w
  where w.level = p_level
    and w.type = 'word'
    and exists (select 1 from en_example_sentences s where s.word_id = w.id)
    and not exists (
      select 1 from en_user_words uw
      where uw.user_id = p_user_id
        and uw.word_id = w.id
    )
  order by random()
  limit p_limit;
$$;

notify pgrst, 'reload schema';
