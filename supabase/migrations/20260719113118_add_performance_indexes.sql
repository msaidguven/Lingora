-- ============================================
-- Performans index'leri: en_user_words / en_user_sentences
-- Bu index'ler olmadan tablo büyüdükçe (binlerce kullanıcı,
-- onbinlerce satır) sorgular yavaşlamaya başlar.
-- ============================================

-- en_user_words
create index if not exists idx_user_words_user_id
  on en_user_words (user_id);

create index if not exists idx_user_words_due
  on en_user_words (user_id, next_review_at);

create index if not exists idx_user_words_word_id
  on en_user_words (user_id, word_id);

-- en_user_sentences
create index if not exists idx_user_sentences_user_id
  on en_user_sentences (user_id);

create index if not exists idx_user_sentences_due
  on en_user_sentences (user_id, next_review_at);

create index if not exists idx_user_sentences_sentence_id
  on en_user_sentences (user_id, sentence_id);