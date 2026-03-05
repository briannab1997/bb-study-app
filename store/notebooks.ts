import { create } from "zustand";
import type {
  Notebook,
  Note,
  FlashcardSet,
  Flashcard,
  NotebookColor,
} from "@/types";
import { db } from "@/lib/supabase";

interface NotebooksState {
  notebooks: Notebook[];
  currentNotebook: Notebook | null;
  notes: Note[];
  currentNote: Note | null;
  flashcardSets: FlashcardSet[];
  flashcards: Flashcard[];
  isLoading: boolean;
  error: string | null;

  // Notebook actions
  fetchNotebooks: (userId: string) => Promise<void>;
  createNotebook: (params: {
    userId: string;
    title: string;
    description?: string;
    color: NotebookColor;
    emoji: string;
  }) => Promise<Notebook | null>;
  updateNotebook: (id: string, updates: Partial<Notebook>) => Promise<void>;
  deleteNotebook: (id: string) => Promise<void>;
  setCurrentNotebook: (notebook: Notebook | null) => void;

  // Note actions
  fetchNotes: (notebookId: string) => Promise<void>;
  createNote: (note: Omit<Note, "id" | "created_at" | "updated_at">) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;

  // Flashcard Set actions
  fetchFlashcardSets: (notebookId: string) => Promise<void>;
  createFlashcardSet: (params: {
    notebookId: string;
    title: string;
    description?: string;
  }) => Promise<FlashcardSet | null>;
  deleteFlashcardSet: (id: string) => Promise<void>;

  // Flashcard actions
  fetchFlashcards: (setId: string) => Promise<void>;
  createFlashcards: (cards: Omit<Flashcard, "id" | "created_at">[]) => Promise<Flashcard[]>;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;

  clearError: () => void;
}

export const useNotebooksStore = create<NotebooksState>((set, get) => ({
  notebooks: [],
  currentNotebook: null,
  notes: [],
  currentNote: null,
  flashcardSets: [],
  flashcards: [],
  isLoading: false,
  error: null,

  // ─── Notebooks ───────────────────────────────────────────────────────────────
  fetchNotebooks: async (userId) => {
    set({ isLoading: true, error: null });
    const { data, error } = await db.notebooks.list(userId);
    if (error) {
      set({ error: error.message, isLoading: false });
      return;
    }
    set({ notebooks: (data || []) as unknown as Notebook[], isLoading: false });
  },

  createNotebook: async ({ userId, title, description, color, emoji }) => {
    const { data, error } = await db.notebooks.create({
      user_id: userId,
      title,
      description: description || null,
      color,
      emoji,
    });
    if (error || !data) return null;
    const notebook = data as unknown as Notebook;
    set((s) => ({ notebooks: [notebook, ...s.notebooks] }));
    return notebook;
  },

  updateNotebook: async (id, updates) => {
    const { data } = await db.notebooks.update(id, updates);
    if (data) {
      set((s) => ({
        notebooks: s.notebooks.map((n) =>
          n.id === id ? { ...n, ...updates } : n
        ),
        currentNotebook:
          s.currentNotebook?.id === id
            ? { ...s.currentNotebook, ...updates }
            : s.currentNotebook,
      }));
    }
  },

  deleteNotebook: async (id) => {
    await db.notebooks.delete(id);
    set((s) => ({
      notebooks: s.notebooks.filter((n) => n.id !== id),
      currentNotebook: s.currentNotebook?.id === id ? null : s.currentNotebook,
    }));
  },

  setCurrentNotebook: (notebook) => set({ currentNotebook: notebook }),

  // ─── Notes ───────────────────────────────────────────────────────────────────
  fetchNotes: async (notebookId) => {
    set({ isLoading: true });
    const { data, error } = await db.notes.list(notebookId);
    if (error) {
      set({ error: error.message, isLoading: false });
      return;
    }
    set({ notes: (data || []) as Note[], isLoading: false });
  },

  createNote: async (note) => {
    const { data, error } = await db.notes.create(note);
    if (error || !data) return null;
    const newNote = data as unknown as Note;
    set((s) => ({ notes: [newNote, ...s.notes] }));
    return newNote;
  },

  updateNote: async (id, updates) => {
    await db.notes.update(id, updates);
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      currentNote:
        s.currentNote?.id === id
          ? { ...s.currentNote, ...updates }
          : s.currentNote,
    }));
  },

  deleteNote: async (id) => {
    await db.notes.delete(id);
    set((s) => ({
      notes: s.notes.filter((n) => n.id !== id),
      currentNote: s.currentNote?.id === id ? null : s.currentNote,
    }));
  },

  setCurrentNote: (note) => set({ currentNote: note }),

  // ─── Flashcard Sets ──────────────────────────────────────────────────────────
  fetchFlashcardSets: async (notebookId) => {
    const { data, error } = await db.flashcardSets.list(notebookId);
    if (error) return;
    set({ flashcardSets: (data || []) as unknown as FlashcardSet[] });
  },

  createFlashcardSet: async ({ notebookId, title, description }) => {
    const { data, error } = await db.flashcardSets.create({
      notebook_id: notebookId,
      title,
      description: description || null,
      card_count: 0,
    });
    if (error || !data) return null;
    const newSet = data as unknown as FlashcardSet;
    set((s) => ({ flashcardSets: [newSet, ...s.flashcardSets] }));
    return newSet;
  },

  deleteFlashcardSet: async (id) => {
    await db.flashcardSets.delete(id);
    set((s) => ({
      flashcardSets: s.flashcardSets.filter((fs) => fs.id !== id),
    }));
  },

  // ─── Flashcards ──────────────────────────────────────────────────────────────
  fetchFlashcards: async (setId) => {
    set({ isLoading: true });
    const { data, error } = await db.flashcards.list(setId);
    if (error) {
      set({ error: error.message, isLoading: false });
      return;
    }
    set({ flashcards: (data || []) as Flashcard[], isLoading: false });
  },

  createFlashcards: async (cards) => {
    const { data, error } = await db.flashcards.insertMany(cards);
    if (error || !data) return [];
    const newCards = data as Flashcard[];
    set((s) => ({ flashcards: [...s.flashcards, ...newCards] }));
    return newCards;
  },

  updateFlashcard: async (id, updates) => {
    await db.flashcards.update(id, updates);
    set((s) => ({
      flashcards: s.flashcards.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  deleteFlashcard: async (id) => {
    await db.flashcards.delete(id);
    set((s) => ({
      flashcards: s.flashcards.filter((c) => c.id !== id),
    }));
  },

  clearError: () => set({ error: null }),
}));
