-- AI anlam önerisi + admin onayı.
-- Listeden (Oxford PDF) gelen anlam AI'a gönderilir; AI yanlış/eksik bulursa önerisi
-- suggested_meaning'e, açıklaması meaning_note'a yazılır. Admin "Anlam Onayı" panelinde
-- yenisini kullanır, ikisini birleştirir ya da reddeder; karar verilince ikisi de boşalır.
alter table en_words add column if not exists suggested_meaning text;
alter table en_words add column if not exists meaning_note text;

create index if not exists en_words_pending_meaning_idx
  on en_words (level) where suggested_meaning is not null;

-- Öğrenciye yalnız hazır kelimeler: cümlesi var ve bekleyen anlam kararı yok.
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
  order by random()
  limit p_limit;
$$;

notify pgrst, 'reload schema';
