// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  streak_days: number;
  total_cards_studied: number;
  total_study_time: number; // seconds
  created_at: string;
}

// ─── Notebooks ────────────────────────────────────────────────────────────────
export type NotebookColor =
  | "violet"
  | "blue"
  | "emerald"
  | "rose"
  | "amber"
  | "cyan";

export interface Notebook {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  color: NotebookColor;
  emoji: string;
  note_count?: number;
  flashcard_count?: number;
  created_at: string;
  updated_at: string;
}

// ─── Notes ────────────────────────────────────────────────────────────────────
export type NoteSourceType = "text" | "pdf" | "url" | "image";

export interface Note {
  id: string;
  notebook_id: string;
  title: string;
  content: string;
  ai_summary: string | null;
  source_type: NoteSourceType;
  source_url: string | null;
  word_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Flashcards ───────────────────────────────────────────────────────────────
export interface FlashcardSet {
  id: string;
  notebook_id: string;
  title: string;
  description: string | null;
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  set_id: string;
  front: string;
  back: string;
  hint: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
  created_at: string;
}

// ─── Spaced Repetition ────────────────────────────────────────────────────────
export interface StudyProgress {
  id: string;
  user_id: string;
  flashcard_id: string;
  ease_factor: number; // SM-2: 2.5 default
  interval: number; // days until next review
  repetitions: number;
  next_review: string; // ISO timestamp
  last_review: string | null;
  last_quality: number | null; // 0-5 rating
}

export type StudyQuality = 0 | 1 | 2 | 3 | 4 | 5;

// ─── Study Session ────────────────────────────────────────────────────────────
export type StudyMode = "flashcard" | "learn" | "test" | "match";

export interface StudySession {
  id: string;
  user_id: string;
  flashcard_set_id: string;
  mode: StudyMode;
  cards_studied: number;
  correct_count: number;
  session_duration: number; // seconds
  completed_at: string;
}

export interface StudyCardResult {
  flashcard_id: string;
  quality: StudyQuality;
  time_taken: number; // milliseconds
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  notebook_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// ─── Supabase ─────────────────────────────────────────────────────────────────
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: Partial<UserProfile> & { id: string };
        Update: Partial<UserProfile>;
      };
      notebooks: {
        Row: Notebook;
        Insert: Omit<Notebook, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Notebook, "id" | "user_id">>;
      };
      notes: {
        Row: Note;
        Insert: Omit<Note, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Note, "id" | "notebook_id">>;
      };
      flashcard_sets: {
        Row: FlashcardSet;
        Insert: Omit<FlashcardSet, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<FlashcardSet, "id" | "notebook_id">>;
      };
      flashcards: {
        Row: Flashcard;
        Insert: Omit<Flashcard, "id" | "created_at">;
        Update: Partial<Omit<Flashcard, "id" | "set_id">>;
      };
      study_progress: {
        Row: StudyProgress;
        Insert: Omit<StudyProgress, "id">;
        Update: Partial<StudyProgress>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, "id" | "created_at">;
        Update: Partial<ChatMessage>;
      };
      study_sessions: {
        Row: StudySession;
        Insert: Omit<StudySession, "id">;
        Update: Partial<StudySession>;
      };
    };
  };
}
