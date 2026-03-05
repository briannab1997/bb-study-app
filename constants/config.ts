export const Config = {
  app: {
    name: "Luminary",
    tagline: "Illuminate your potential.",
    version: "1.0.0",
  },

  study: {
    defaultEaseFactor: 2.5,
    minEaseFactor: 1.3,
    maxEaseFactor: 3.0,
    initialInterval: 1,
    graduatingInterval: 4,
    easyInterval: 7,
  },

  ai: {
    model: "claude-sonnet-4-6" as const,
    maxFlashcardsPerGeneration: 20,
    maxContextLength: 50000,
    chatSystemPrompt: `You are Luminary's AI tutor. You help students understand their study materials.
Be concise, clear, and encouraging. When answering questions:
- Reference the provided notes when relevant
- Break down complex concepts simply
- Use examples to illustrate points
- Suggest follow-up study topics when appropriate`,
  },

  ui: {
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      full: 9999,
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    animation: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
  },

  limits: {
    maxNotebooksPerUser: 50,
    maxNotesPerNotebook: 200,
    maxFlashcardSetsPerNotebook: 20,
    maxFlashcardsPerSet: 500,
    maxChatMessagesPerNotebook: 1000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },

  notebookEmojis: [
    "📚", "🎓", "🔬", "🧪", "💡", "🧠", "🌟", "⚡",
    "🎯", "📖", "✏️", "🗺️", "🔭", "🧮", "💻", "🎨",
    "🌍", "🏛️", "🔢", "📊",
  ],

  notebookColors: [
    "violet", "blue", "emerald", "rose", "amber", "cyan",
  ] as const,
} as const;
