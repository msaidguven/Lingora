-- Ana sayfadaki "+N Kelime/Cümle Al" düğmesi için: kullanıcının alabileceği hazır öğe sayısı.
-- Koşullar get_new_words / get_new_sentences ile aynı olmalı.
create or replace function count_new_items(p_kind text, p_level text)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case p_kind
    when 'word' then (
      select count(*)::int from en_words w
       where w.level = p_level
         and w.type = 'word'
         and w.suggested_meaning is null
         and exists (select 1 from en_example_sentences s where s.word_id = w.id)
         and not exists (select 1 from en_user_words uw where uw.user_id = auth.uid() and uw.word_id = w.id))
    when 'sentence' then (
      select count(*)::int from en_example_sentences s
       where s.level = p_level
         and s.is_approved = true
         and not exists (select 1 from en_user_sentences us where us.user_id = auth.uid() and us.sentence_id = s.id))
    else 0
  end;
$$;

revoke all on function count_new_items(text, text) from public, anon;
grant execute on function count_new_items(text, text) to authenticated;

notify pgrst, 'reload schema';
