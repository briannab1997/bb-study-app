import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import type { Database } from "@/types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Use localStorage on web, AsyncStorage on native — both are safe at runtime
const storage = Platform.OS === "web" && typeof window !== "undefined"
  ? undefined  // Supabase defaults to localStorage on web
  : AsyncStorage;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Auth Helpers ──────────────────────────────────────────────────────────────
export const authHelpers = {
  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  },

  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { user: data.user, error };
  },
};

// ─── Database Helpers ──────────────────────────────────────────────────────────
export const db = {
  // Profiles
  profiles: {
    get: async (userId: string) =>
      supabase.from("profiles").select("*").eq("id", userId).single(),

    upsert: async (profile: Partial<{ id: string; full_name: string; avatar_url: string }> & { id: string }) =>
      supabase.from("profiles").upsert(profile),

    updateStreak: async (userId: string, streak: number) =>
      supabase.from("profiles").update({ streak_days: streak }).eq("id", userId),
  },

  // Notebooks
  notebooks: {
    list: async (userId: string) =>
      supabase
        .from("notebooks")
        .select("*, notes(count), flashcard_sets(flashcards(count))")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),

    get: async (id: string) =>
      supabase.from("notebooks").select("*").eq("id", id).single(),

    create: async (notebook: Database["public"]["Tables"]["notebooks"]["Insert"]) =>
      supabase.from("notebooks").insert(notebook).select().single(),

    update: async (id: string, updates: Database["public"]["Tables"]["notebooks"]["Update"]) =>
      supabase.from("notebooks").update(updates).eq("id", id).select().single(),

    delete: async (id: string) =>
      supabase.from("notebooks").delete().eq("id", id),
  },

  // Notes
  notes: {
    list: async (notebookId: string) =>
      supabase
        .from("notes")
        .select("*")
        .eq("notebook_id", notebookId)
        .order("updated_at", { ascending: false }),

    get: async (id: string) =>
      supabase.from("notes").select("*").eq("id", id).single(),

    create: async (note: Database["public"]["Tables"]["notes"]["Insert"]) =>
      supabase.from("notes").insert(note).select().single(),

    update: async (id: string, updates: Database["public"]["Tables"]["notes"]["Update"]) =>
      supabase.from("notes").update(updates).eq("id", id).select().single(),

    delete: async (id: string) =>
      supabase.from("notes").delete().eq("id", id),
  },

  // Flashcard Sets
  flashcardSets: {
    list: async (notebookId: string) =>
      supabase
        .from("flashcard_sets")
        .select("*, flashcards(count)")
        .eq("notebook_id", notebookId)
        .order("created_at", { ascending: false }),

    get: async (id: string) =>
      supabase.from("flashcard_sets").select("*").eq("id", id).single(),

    create: async (set: Database["public"]["Tables"]["flashcard_sets"]["Insert"]) =>
      supabase.from("flashcard_sets").insert(set).select().single(),

    delete: async (id: string) =>
      supabase.from("flashcard_sets").delete().eq("id", id),
  },

  // Flashcards
  flashcards: {
    list: async (setId: string) =>
      supabase
        .from("flashcards")
        .select("*")
        .eq("set_id", setId)
        .order("created_at", { ascending: true }),

    insertMany: async (cards: Database["public"]["Tables"]["flashcards"]["Insert"][]) =>
      supabase.from("flashcards").insert(cards).select(),

    update: async (id: string, updates: Database["public"]["Tables"]["flashcards"]["Update"]) =>
      supabase.from("flashcards").update(updates).eq("id", id).select().single(),

    delete: async (id: string) =>
      supabase.from("flashcards").delete().eq("id", id),
  },

  // Study Progress (Spaced Repetition)
  studyProgress: {
    getDue: async (userId: string) =>
      supabase
        .from("study_progress")
        .select("*, flashcards(*)")
        .eq("user_id", userId)
        .lte("next_review", new Date().toISOString())
        .order("next_review", { ascending: true }),

    getForSet: async (userId: string, setId: string) =>
      supabase
        .from("study_progress")
        .select("*, flashcards!inner(*)")
        .eq("user_id", userId)
        .eq("flashcards.set_id", setId),

    upsert: async (progress: Database["public"]["Tables"]["study_progress"]["Insert"]) =>
      supabase.from("study_progress").upsert(progress, {
        onConflict: "user_id,flashcard_id",
      }),
  },

  // Chat Messages
  chatMessages: {
    list: async (notebookId: string, limit = 50) =>
      supabase
        .from("chat_messages")
        .select("*")
        .eq("notebook_id", notebookId)
        .order("created_at", { ascending: true })
        .limit(limit),

    insert: async (message: Database["public"]["Tables"]["chat_messages"]["Insert"]) =>
      supabase.from("chat_messages").insert(message).select().single(),

    clearHistory: async (notebookId: string) =>
      supabase.from("chat_messages").delete().eq("notebook_id", notebookId),
  },

  // Study Sessions
  studySessions: {
    create: async (session: Database["public"]["Tables"]["study_sessions"]["Insert"]) =>
      supabase.from("study_sessions").insert(session).select().single(),

    getRecent: async (userId: string, limit = 10) =>
      supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(limit),

    getStats: async (userId: string) =>
      supabase
        .from("study_sessions")
        .select("cards_studied, correct_count, session_duration, mode")
        .eq("user_id", userId),
  },
};
