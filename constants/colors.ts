export const Colors = {
  // ─── Brand ──────────────────────────────────────────────────────────────────
  brand: {
    50: "#F3F0FF",
    100: "#E9E3FF",
    200: "#D4C9FF",
    300: "#B4A0FF",
    400: "#9170FF",
    500: "#7C3AED",
    600: "#6D28D9",
    700: "#5B21B6",
  },

  // ─── Gold Accent (the "luminary" light) ────────────────────────────────────
  gold: {
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
  },

  // ─── Backgrounds ────────────────────────────────────────────────────────────
  bg: {
    primary: "#0A0A14",   // Main background
    secondary: "#0F0F1A", // Secondary bg
    tertiary: "#14141F",  // Tertiary bg
  },

  // ─── Surface/Cards ──────────────────────────────────────────────────────────
  surface: {
    primary: "#1A1A2E",   // Card background
    secondary: "#1E1E38", // Elevated card
    tertiary: "#252540",  // Highest elevation
  },

  // ─── Text ───────────────────────────────────────────────────────────────────
  text: {
    primary: "#F8FAFC",
    secondary: "#94A3B8",
    tertiary: "#64748B",
    inverse: "#0A0A14",
  },

  // ─── Border ─────────────────────────────────────────────────────────────────
  border: {
    primary: "#2D2D4A",
    secondary: "#1E1E38",
    focus: "#7C3AED",
  },

  // ─── Semantic ───────────────────────────────────────────────────────────────
  success: "#10B981",
  successLight: "#D1FAE5",
  error: "#F43F5E",
  errorLight: "#FFE4E6",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  info: "#3B82F6",
  infoLight: "#DBEAFE",

  // ─── Notebook Colors ────────────────────────────────────────────────────────
  notebook: {
    violet: "#7C3AED",
    blue: "#3B82F6",
    emerald: "#10B981",
    rose: "#F43F5E",
    amber: "#F59E0B",
    cyan: "#06B6D4",
  },

  // ─── Gradient Presets ───────────────────────────────────────────────────────
  gradients: {
    brand: ["#7C3AED", "#4F46E5"] as const,
    gold: ["#F59E0B", "#F97316"] as const,
    dark: ["#0A0A14", "#14141F"] as const,
    card: ["#1A1A2E", "#14141F"] as const,
    success: ["#10B981", "#059669"] as const,
    error: ["#F43F5E", "#E11D48"] as const,
  },

  // Primitives
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;
