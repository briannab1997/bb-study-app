import { create } from "zustand";
import type { User, UserProfile } from "@/types";
import { authHelpers, db } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const { session } = await authHelpers.getSession();
      if (session?.user) {
        set({
          user: session.user as unknown as User,
          isAuthenticated: true,
        });
        await get().refreshProfile();
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await authHelpers.signIn(email, password);
      if (error) return error.message;
      if (data.user) {
        set({ user: data.user as unknown as User, isAuthenticated: true });
        await get().refreshProfile();
      }
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      const { data, error } = await authHelpers.signUp(email, password, fullName);
      if (error) return error.message;
      if (data.user) {
        set({ user: data.user as unknown as User, isAuthenticated: true });
        // Create initial profile
        await db.profiles.upsert({
          id: data.user.id,
          full_name: fullName,
          avatar_url: null,
        });
        await get().refreshProfile();
      }
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await authHelpers.signOut();
    set({ user: null, profile: null, isAuthenticated: false });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const { data } = await db.profiles.get(user.id);
    if (data) set({ profile: data as unknown as UserProfile });
  },

  updateProfile: async (updates) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    await db.profiles.upsert({ id: user.id, ...updates });
    set({ profile: { ...profile, ...updates } });
  },
}));
