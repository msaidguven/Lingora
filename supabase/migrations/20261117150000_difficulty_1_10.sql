-- Seviye içi zorluk 1-10.
-- Kelime: kullanım sıklığından (wordfreq) hesaplanır — her seviye sıklığa göre 10 eşit
--   gruba bölünür (tool/zorluk_hesapla.py). 1 = seviyenin en sık kullanılan %10'u.
-- Cümle: AI cümleyi üretirken seviyeye göre 1-10 puan verir.
-- Yeni kelime/cümle kullanıcıya kolaydan zora verilir (aynı zorlukta rastgele).

alter table en_words drop constraint if exists en_words_difficulty_check;
alter table en_words add constraint en_words_difficulty_check
  check (difficulty between 1 and 10);

alter table en_example_sentences add column if not exists difficulty int;
alter table en_example_sentences drop constraint if exists en_example_sentences_difficulty_check;
alter table en_example_sentences add constraint en_example_sentences_difficulty_check
  check (difficulty between 1 and 10);

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
    and w.suggested_meaning is null
    and exists (select 1 from en_example_sentences s where s.word_id = w.id)
    and not exists (
      select 1 from en_user_words uw
      where uw.user_id = p_user_id
        and uw.word_id = w.id
    )
  order by w.difficulty nulls last, random()
  limit p_limit;
$$;

create or replace function get_new_sentences(
  p_user_id uuid,
  p_level text,
  p_limit int default 5
)
returns setof en_example_sentences
language sql
security definer
set search_path = public
as $$
  select s.*
  from en_example_sentences s
  where s.level = p_level
    and s.is_approved = true
    and not exists (
      select 1 from en_user_sentences us
      where us.user_id = p_user_id
        and us.sentence_id = s.id
    )
  order by s.difficulty nulls last, random()
  limit p_limit;
$$;

-- Admin: cümlesi olmayan kelimeler de kolaydan zora — önce en kolaylara cümle eklenir.
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
   order by w.difficulty nulls last, lower(w.word)
   limit p_limit;
$$;

notify pgrst, 'reload schema';
