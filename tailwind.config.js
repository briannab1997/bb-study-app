/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Luminary brand colors
        brand: {
          50: "#F3F0FF",
          100: "#E9E3FF",
          200: "#D4C9FF",
          300: "#B4A0FF",
          400: "#9170FF",
          500: "#7C3AED",
          600: "#6D28D9",
          700: "#5B21B6",
          800: "#4C1D95",
          900: "#3B1678",
        },
        gold: {
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },
        // Dark theme backgrounds
        surface: {
          50: "#1A1A2E",
          100: "#14141F",
          200: "#0F0F1A",
          300: "#0A0A14",
        },
        card: "#1A1A2E",
        border: "#2D2D4A",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
