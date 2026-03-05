-- ============================================================
-- Luminary - AI Study App
-- Supabase Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- 1. Profiles (extends Supabase auth.users)
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  streak_days INTEGER DEFAULT 0,
  total_cards_studied INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0, -- seconds
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 2. Notebooks
-- ────────────────────────────────────────────────────────────
CREATE TYPE notebook_color AS ENUM ('violet', 'blue', 'emerald', 'rose', 'amber', 'cyan');

CREATE TABLE public.notebooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 60),
  description TEXT CHECK (char_length(description) <= 200),
  color notebook_color NOT NULL DEFAULT 'violet',
  emoji TEXT NOT NULL DEFAULT '📚',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notebooks_user_id ON public.notebooks(user_id);
CREATE INDEX idx_notebooks_updated_at ON public.notebooks(updated_at DESC);

-- ────────────────────────────────────────────────────────────
-- 3. Notes
-- ────────────────────────────────────────────────────────────
CREATE TYPE note_source_type AS ENUM ('text', 'pdf', 'url', 'image');

CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT NOT NULL DEFAULT '',
  ai_summary TEXT,
  source_type note_source_type NOT NULL DEFAULT 'text',
  source_url TEXT,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notes_notebook_id ON public.notes(notebook_id);
CREATE INDEX idx_notes_updated_at ON public.notes(updated_at DESC);

-- ────────────────────────────────────────────────────────────
-- 4. Flashcard Sets
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.flashcard_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  card_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_flashcard_sets_notebook_id ON public.flashcard_sets(notebook_id);

-- ────────────────────────────────────────────────────────────
-- 5. Flashcards
-- ────────────────────────────────────────────────────────────
CREATE TYPE card_difficulty AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id UUID NOT NULL REFERENCES public.flashcard_sets(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT,
  difficulty card_difficulty,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_flashcards_set_id ON public.flashcards(set_id);

-- Auto-update card_count on flashcard_sets
CREATE OR REPLACE FUNCTION update_flashcard_set_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.flashcard_sets
    SET card_count = card_count + 1
    WHERE id = NEW.set_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.flashcard_sets
    SET card_count = GREATEST(card_count - 1, 0)
    WHERE id = OLD.set_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flashcard_count_trigger
  AFTER INSERT OR DELETE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION update_flashcard_set_count();

-- ────────────────────────────────────────────────────────────
-- 6. Study Progress (Spaced Repetition - SM-2)
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.study_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  ease_factor FLOAT NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3),
  interval INTEGER NOT NULL DEFAULT 1 CHECK (interval >= 0),
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_review TIMESTAMPTZ,
  last_quality SMALLINT CHECK (last_quality BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, flashcard_id)
);

CREATE INDEX idx_study_progress_user_next ON public.study_progress(user_id, next_review);
CREATE INDEX idx_study_progress_flashcard ON public.study_progress(flashcard_id);

-- ────────────────────────────────────────────────────────────
-- 7. Chat Messages (AI Tutor)
-- ────────────────────────────────────────────────────────────
CREATE TYPE chat_role AS ENUM ('user', 'assistant');

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  role chat_role NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_chat_messages_notebook ON public.chat_messages(notebook_id, created_at);

-- ────────────────────────────────────────────────────────────
-- 8. Study Sessions
-- ────────────────────────────────────────────────────────────
CREATE TYPE study_mode AS ENUM ('flashcard', 'learn', 'test', 'match');

CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE SET NULL,
  mode study_mode NOT NULL DEFAULT 'flashcard',
  cards_studied INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  session_duration INTEGER NOT NULL DEFAULT 0, -- seconds
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_study_sessions_user ON public.study_sessions(user_id, completed_at DESC);

-- Update profile stats after each session
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    total_cards_studied = total_cards_studied + NEW.cards_studied,
    total_study_time = total_study_time + NEW.session_duration,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_stats_trigger
  AFTER INSERT ON public.study_sessions
  FOR EACH ROW EXECUTE FUNCTION update_profile_stats();

-- ────────────────────────────────────────────────────────────
-- 9. Updated_at Triggers
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notebooks_updated_at
  BEFORE UPDATE ON public.notebooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER flashcard_sets_updated_at
  BEFORE UPDATE ON public.flashcard_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- 10. Row Level Security (RLS)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Notebooks
CREATE POLICY "Users can manage own notebooks" ON public.notebooks
  FOR ALL USING (auth.uid() = user_id);

-- Notes (via notebook ownership)
CREATE POLICY "Users can manage own notes" ON public.notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.notebooks
      WHERE notebooks.id = notes.notebook_id
      AND notebooks.user_id = auth.uid()
    )
  );

-- Flashcard Sets
CREATE POLICY "Users can manage own flashcard sets" ON public.flashcard_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.notebooks
      WHERE notebooks.id = flashcard_sets.notebook_id
      AND notebooks.user_id = auth.uid()
    )
  );

-- Flashcards
CREATE POLICY "Users can manage own flashcards" ON public.flashcards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_sets
      JOIN public.notebooks ON notebooks.id = flashcard_sets.notebook_id
      WHERE flashcard_sets.id = flashcards.set_id
      AND notebooks.user_id = auth.uid()
    )
  );

-- Study Progress
CREATE POLICY "Users can manage own study progress" ON public.study_progress
  FOR ALL USING (auth.uid() = user_id);

-- Chat Messages
CREATE POLICY "Users can manage own chat messages" ON public.chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.notebooks
      WHERE notebooks.id = chat_messages.notebook_id
      AND notebooks.user_id = auth.uid()
    )
  );

-- Study Sessions
CREATE POLICY "Users can manage own sessions" ON public.study_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 11. Storage Buckets
-- ────────────────────────────────────────────────────────────
-- Run in Supabase Storage:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('note-uploads', 'note-uploads', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies
-- CREATE POLICY "Users can upload to own folder" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'note-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can read own uploads" ON storage.objects
--   FOR SELECT USING (bucket_id = 'note-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
