-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.en_words (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  word text NOT NULL UNIQUE,
  meaning text NOT NULL,
  level text CHECK (level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text])),
  type text DEFAULT 'word'::text CHECK (type = ANY (ARRAY['word'::text, 'phrase'::text])),
  part_of_speech ARRAY DEFAULT '{}'::text[],
  category ARRAY DEFAULT '{}'::text[],
  difficulty integer CHECK (difficulty >= 1 AND difficulty <= 5),
  synonyms ARRAY DEFAULT '{}'::text[],
  antonyms ARRAY DEFAULT '{}'::text[],
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT en_words_pkey PRIMARY KEY (id)
);
CREATE TABLE public.en_users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  username text UNIQUE,
  avatar_url text,
  level text DEFAULT 'A1'::text,
  total_points integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  last_active_at timestamp without time zone DEFAULT now(),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['admin'::text, 'editor'::text, 'moderator'::text, 'premium'::text, 'user'::text])),
  CONSTRAINT en_users_pkey PRIMARY KEY (id),
  CONSTRAINT en_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.en_lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lesson_number integer NOT NULL,
  title text NOT NULL,
  level text NOT NULL DEFAULT 'A1'::text,
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT en_lessons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.en_lesson_words (
  lesson_id uuid NOT NULL,
  word_id uuid NOT NULL,
  CONSTRAINT en_lesson_words_pkey PRIMARY KEY (lesson_id, word_id),
  CONSTRAINT en_lesson_words_word_id_fkey FOREIGN KEY (word_id) REFERENCES public.en_words(id)
);
CREATE TABLE public.en_example_sentences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  word_id uuid,
  sentence_en text NOT NULL,
  sentence_tr text,
  difficulty integer CHECK (difficulty >= 1 AND difficulty <= 5),
  order_index smallint DEFAULT 0,
  source text DEFAULT 'manual'::text,
  is_approved boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT en_example_sentences_pkey PRIMARY KEY (id),
  CONSTRAINT en_example_sentences_word_id_fkey FOREIGN KEY (word_id) REFERENCES public.en_words(id)
);
CREATE TABLE public.en_quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  word_id uuid,
  question_text text NOT NULL,
  options ARRAY NOT NULL DEFAULT '{}'::text[],
  correct_answer text NOT NULL,
  difficulty integer CHECK (difficulty >= 1 AND difficulty <= 5),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT en_quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT en_quiz_questions_word_id_fkey FOREIGN KEY (word_id) REFERENCES public.en_words(id)
);
CREATE TABLE public.en_user_words (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  word_id uuid,
  added_at timestamp without time zone DEFAULT now(),
  next_review_at timestamp without time zone DEFAULT now(),
  ease_factor double precision DEFAULT 2.5,
  review_count integer DEFAULT 0,
  last_score integer CHECK (last_score >= 0 AND last_score <= 100),
  last_reviewed_at timestamp without time zone,
  is_mastered boolean DEFAULT false,
  mastery_level integer DEFAULT 0,
  total_correct integer DEFAULT 0,
  total_wrong integer DEFAULT 0,
  CONSTRAINT en_user_words_pkey PRIMARY KEY (id),
  CONSTRAINT en_user_words_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.en_users(id),
  CONSTRAINT en_user_words_word_id_fkey FOREIGN KEY (word_id) REFERENCES public.en_words(id)
);
CREATE TABLE public.en_user_daily_limit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  remaining_today integer DEFAULT 5,
  last_reset_date date DEFAULT CURRENT_DATE,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT en_user_daily_limit_pkey PRIMARY KEY (id),
  CONSTRAINT en_user_daily_limit_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.en_users(id)
);
CREATE TABLE public.en_user_quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  question_id uuid,
  user_answer text NOT NULL,
  is_correct boolean NOT NULL,
  attempted_at timestamp without time zone DEFAULT now(),
  CONSTRAINT en_user_quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT en_user_quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.en_users(id),
  CONSTRAINT en_user_quiz_attempts_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.en_quiz_questions(id)
);
CREATE TABLE public.en_user_lesson_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  lesson_id uuid,
  completed boolean DEFAULT false,
  score integer,
  completed_at timestamp without time zone,
  wrong_questions jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT en_user_lesson_progress_pkey PRIMARY KEY (id),
  CONSTRAINT en_user_lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.en_users(id)
);
CREATE TABLE public.en_user_sentences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  sentence_id uuid,
  added_at timestamp without time zone DEFAULT now(),
  next_review_at timestamp without time zone DEFAULT now(),
  ease_factor double precision DEFAULT 2.5,
  review_count integer DEFAULT 0,
  last_score integer CHECK (last_score >= 0 AND last_score <= 100),
  last_reviewed_at timestamp without time zone,
  total_correct integer DEFAULT 0,
  total_wrong integer DEFAULT 0,
  CONSTRAINT en_user_sentences_pkey PRIMARY KEY (id),
  CONSTRAINT en_user_sentences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.en_users(id),
  CONSTRAINT en_user_sentences_sentence_id_fkey FOREIGN KEY (sentence_id) REFERENCES public.en_example_sentences(id)
);
CREATE TABLE public.en_user_daily_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  stat_date date NOT NULL,
  word_correct integer DEFAULT 0,
  word_wrong integer DEFAULT 0,
  sentence_correct integer DEFAULT 0,
  sentence_wrong integer DEFAULT 0,
  total_correct integer DEFAULT 0,
  total_wrong integer DEFAULT 0,
  total_attempts integer DEFAULT 0,
  accuracy numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT en_user_daily_stats_pkey PRIMARY KEY (id),
  CONSTRAINT en_user_daily_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.en_users(id)
);
CREATE TABLE public.en_user_stats (
  user_id uuid NOT NULL,
  total_words_learned integer DEFAULT 0,
  total_quizzes_taken integer DEFAULT 0,
  total_correct_answers integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT en_user_stats_pkey PRIMARY KEY (user_id),
  CONSTRAINT en_user_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);