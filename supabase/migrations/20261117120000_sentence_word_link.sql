-- Örnek cümleleri yeniden kelimeye bağla (isteğe bağlı bağlantı).
-- Admin panelinde AI ile eklenen her kelimenin 5 cümlesi word_id ile kaydedilir;
-- kelimeye bağlı olmayan cümleler (word_id boş) de eklenebilir.
-- Kelime silinince ona bağlı cümleler de silinir (en_user_sentences zaten cascade).
alter table en_example_sentences
  add column if not exists word_id uuid references en_words(id) on delete cascade;

create index if not exists en_example_sentences_word_id_idx on en_example_sentences (word_id);

notify pgrst, 'reload schema';
