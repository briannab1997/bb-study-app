# ✨ Luminary — AI-Powered Study App

> **Illuminate your potential.** A FAANG-level study application combining the best of NotebookLM, Quizlet, and Knowt.

![Expo](https://img.shields.io/badge/Expo-SDK%2055-black?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.79-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-latest-3ECF8E?logo=supabase)
![Claude AI](https://img.shields.io/badge/Claude-Sonnet%204.6-FF6B35?logo=anthropic)

---

## 🌟 Features

### 📝 Smart Notes
- Rich text notes editor with auto-save
- AI-powered **note summarization** using Claude
- PDF/document import ready
- Word count tracking

### ⚡ AI Flashcard Generation
- Auto-generate flashcards from notes with **Claude Sonnet 4.6**
- Multiple difficulty levels (Easy, Medium, Hard)
- Hints auto-generated for each card
- Manual card creation and editing

### 🃏 Interactive Study Modes
- **Flashcard Mode** — Tap to flip, swipe to rate
- **Spaced Repetition** — SM-2 algorithm (same as Anki)
- **Rating System** — Again / Hard / Good / Easy
- Swipe left (wrong) / swipe right (correct) gestures

### 💬 AI Tutor Chat
- Chat with your notes using **NotebookLM-style** AI
- Full notebook context awareness
- Persistent chat history per notebook
- Powered by Claude with notebook context injection

### 📊 Progress Analytics
- Daily study streaks
- Accuracy tracking per session
- Total cards studied & study time
- Weekly activity visualization
- Achievement system (6 achievements)

### 🎨 Premium Design
- Dark theme with violet/gold brand palette
- Smooth Reanimated 3 animations
- Haptic feedback throughout
- Card flip animations with 3D perspective
- Gradient backgrounds and glass morphism

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Mobile** | Expo SDK 55 + React Native 0.79 |
| **Navigation** | Expo Router v5 (file-based) |
| **Language** | TypeScript (strict mode) |
| **Styling** | NativeWind v4 + StyleSheet |
| **Animations** | React Native Reanimated 3 |
| **Gestures** | React Native Gesture Handler |
| **State** | Zustand v5 |
| **Auth** | Supabase Auth |
| **Database** | Supabase (PostgreSQL) with RLS |
| **AI** | Anthropic Claude Sonnet 4.6 |
| **Icons** | @expo/vector-icons (Ionicons) |
| **Dates** | date-fns |

---

## 🚀 Setup

### Prerequisites
- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or Expo Go app)
- [Supabase](https://supabase.com) account
- [Anthropic](https://console.anthropic.com) API key

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/luminary
cd luminary
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Fill in your `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Enable **Email Auth** in Authentication → Providers

### 4. Run the App

```bash
# Start development server
npm start

# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web (PWA)
npm run web
```

---

## 📁 Project Structure

```
luminary/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Auth redirect
│   ├── (auth)/                   # Auth flow
│   │   ├── welcome.tsx           # Onboarding
│   │   ├── login.tsx             # Sign in
│   │   └── register.tsx          # Sign up
│   ├── (tabs)/                   # Main app tabs
│   │   ├── home.tsx              # Dashboard
│   │   ├── library.tsx           # Notebooks list
│   │   ├── study.tsx             # Study hub
│   │   └── profile.tsx           # Progress + settings
│   ├── notebook/
│   │   ├── [id].tsx              # Notebook detail (notes/flashcards/chat)
│   │   └── new.tsx               # Create notebook
│   └── flashcards/
│       ├── [setId].tsx           # Flashcard set view
│       └── study/[setId].tsx     # Study session
├── components/
│   ├── ui/                       # Design system primitives
│   ├── notebook/                 # Notebook components
│   ├── flashcard/                # Flashcard components
│   ├── chat/                     # Chat UI
│   └── common/                   # Shared components
├── lib/
│   ├── supabase.ts               # Supabase client + DB helpers
│   ├── claude.ts                 # Claude AI integration
│   └── spaced-repetition.ts     # SM-2 algorithm
├── store/
│   ├── auth.ts                   # Auth state (Zustand)
│   └── notebooks.ts              # Notebooks state
├── types/index.ts                # TypeScript types + DB schema
├── constants/
│   ├── colors.ts                 # Design tokens
│   └── config.ts                 # App configuration
└── supabase/schema.sql           # Database schema + RLS policies
```

---

## 🧠 AI Architecture

### Flashcard Generation
- Sends note content + title to Claude Sonnet 4.6
- Generates 15 flashcards with front, back, hint, difficulty
- JSON structured output with validation
- Automatic set creation in Supabase

### AI Tutor Chat
- System prompt includes all notebook notes as context
- Maintains conversation history (last 10 messages)
- Grounded responses reference specific note content
- Persisted to Supabase for cross-session continuity

### Note Summarization
- Generates concise bullet-point summaries
- Stored in `ai_summary` field on notes table
- Displayed inline on note cards

---

## 📚 Spaced Repetition (SM-2)

Based on the SuperMemo 2 algorithm — the same system used by Anki.

| Rating | Meaning | Effect |
|---|---|---|
| **Again (0)** | Complete blackout | Reset to 1 day |
| **Hard (2)** | Incorrect but recalled | Short interval |
| **Good (4)** | Correct with hesitation | Normal interval |
| **Easy (5)** | Perfect recall | Long interval |

The ease factor starts at 2.5 and adjusts based on performance, creating personalized review schedules.

---

## 🔒 Security

- **Row Level Security (RLS)** on all Supabase tables
- Users can only access their own data
- API keys stored in environment variables
- Supabase anon key is safe for client-side use

---

## 📱 Supported Platforms

| Platform | Status |
|---|---|
| iOS | ✅ Full support |
| Android | ✅ Full support |
| Web (PWA) | ✅ Experimental |

---

## 🛣 Roadmap

- [ ] PDF upload and text extraction
- [ ] Match game study mode
- [ ] Audio overview (TTS summaries)
- [ ] Collaborative notebooks
- [ ] Push notification study reminders
- [ ] Import from Quizlet/Anki
- [ ] Offline support
- [ ] Apple/Google sign-in

---

## 👩‍💻 Built By

Built with ❤️ as a portfolio project showcasing:
- AI integration (Claude API)
- Mobile development (React Native + Expo)
- Backend architecture (Supabase + PostgreSQL)
- Complex algorithms (Spaced Repetition SM-2)
- Premium UI/UX design

---

*Luminary — Illuminate your potential.*
