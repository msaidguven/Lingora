-- CASCADE ile sil (bağımlı tabloları otomatik siler)
DROP TABLE IF EXISTS en_user_quiz_attempts CASCADE;
DROP TABLE IF EXISTS en_user_lesson_progress CASCADE;
DROP TABLE IF EXISTS en_user_word_progress CASCADE;
DROP TABLE IF EXISTS en_lesson_words CASCADE;
DROP TABLE IF EXISTS en_quiz_questions CASCADE;
DROP TABLE IF EXISTS en_example_sentences CASCADE;
DROP TABLE IF EXISTS en_lessons CASCADE;
DROP TABLE IF EXISTS en_user_stats CASCADE;
DROP TABLE IF EXISTS en_words CASCADE;

-- TABLOLARI YENİDEN OLUŞTUR

CREATE TABLE en_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  meaning text NOT NULL,
  level text CHECK (level IN ('A1', 'A2', 'B1', 'B2')),
  type text DEFAULT 'word' CHECK (type IN ('word', 'phrase')),
  part_of_speech text[],
  category text[],
  difficulty int CHECK (difficulty BETWEEN 1 AND 5),
  synonyms text[],
  antonyms text[],
  created_at timestamp DEFAULT now()
);

CREATE TABLE en_user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_words_learned int DEFAULT 0,
  total_quizzes_taken int DEFAULT 0,
  total_correct_answers int DEFAULT 0,
  streak_days int DEFAULT 0,
  updated_at timestamp DEFAULT now()
);

CREATE TABLE en_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_number int UNIQUE,
  title text,
  level text,
  content_json jsonb,
  created_at timestamp DEFAULT now()
);

CREATE TABLE en_example_sentences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id uuid REFERENCES en_words(id) ON DELETE CASCADE,
  sentence_en text NOT NULL,
  sentence_tr text,
  difficulty int CHECK (difficulty BETWEEN 1 AND 5),
  order_index smallint DEFAULT 0,
  source text DEFAULT 'manual',
  is_approved boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX idx_en_example_sentences_word_id ON en_example_sentences(word_id, order_index);

CREATE TABLE en_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id uuid REFERENCES en_words(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options text[] NOT NULL,
  correct_answer text NOT NULL,
  difficulty int CHECK (difficulty BETWEEN 1 AND 5),
  created_at timestamp DEFAULT now()
);

CREATE TABLE en_lesson_words (
  lesson_id uuid REFERENCES en_lessons(id) ON DELETE CASCADE,
  word_id uuid REFERENCES en_words(id) ON DELETE CASCADE,
  PRIMARY KEY (lesson_id, word_id)
);

CREATE TABLE en_user_word_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id uuid REFERENCES en_words(id) ON DELETE CASCADE,
  known boolean DEFAULT false,
  review_count int DEFAULT 0,
  last_reviewed_at timestamp,
  next_review_at timestamp,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, word_id)
);

CREATE TABLE en_user_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES en_lessons(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  score int,
  completed_at timestamp,
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE en_user_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid REFERENCES en_quiz_questions(id) ON DELETE CASCADE,
  user_answer text NOT NULL,
  is_correct boolean NOT NULL,
  attempted_at timestamp DEFAULT now()
);