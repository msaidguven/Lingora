-- ============================================
-- get_new_words / get_new_sentences
-- Kullanıcının henüz öğrenmediği kelime/cümlelerden rastgele bir
-- aday havuzu döndürür. Filtreleme tamamen sunucu tarafında NOT
-- EXISTS ile yapılır — client'tan öğrenilen id listesi göndermeye
-- gerek kalmaz, bu da URL uzunluk limitine takılma (400 Bad
-- Request) sorununu tamamen ortadan kaldırır.
-- ============================================

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
    and not exists (
      select 1 from en_user_words uw
      where uw.user_id = p_user_id
        and uw.word_id = w.id
    )
  order by random()
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
  order by random()
  limit p_limit;
$$;

-- authenticated role'ün bu fonksiyonları çağırabilmesini sağlar.
grant execute on function get_new_words(uuid, text, int) to authenticated;
grant execute on function get_new_sentences(uuid, text, int) to authenticated;