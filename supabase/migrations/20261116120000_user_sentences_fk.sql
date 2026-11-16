-- en_user_sentences.sentence_id için yabancı anahtar YOKTU. PostgREST ilişkiyi
-- bulamadığından `en_example_sentences!inner(level)` ve Dashboard'daki gömme
-- sorguları hata verip sessizce boş dönüyordu: "Cümle hazinem" hep 0 görünüyordu.
alter table en_user_sentences
  add constraint en_user_sentences_sentence_id_fkey
  foreign key (sentence_id) references en_example_sentences(id) on delete cascade;

-- Aynı cümle aynı kullanıcıya iki kez eklenemesin.
create unique index if not exists en_user_sentences_user_sentence_uidx
  on en_user_sentences (user_id, sentence_id);

notify pgrst, 'reload schema';
