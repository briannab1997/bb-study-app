# Luminary

A study app I built as a portfolio project. The idea came from bouncing between NotebookLM, Quizlet, and Knowt depending on what I needed — I wanted one app that did all of it. You can drop in notes or a PDF, get flashcards generated automatically, quiz yourself, and ask the AI questions about your own material. It runs on iOS and Android from one codebase.

---

## What it does

**Notes & AI Summarization**
Write notes directly in the app or import a PDF. Hit "Summarize" and you get a clean bullet-point breakdown saved right on the note. Nothing fancy — it just works.

**Flashcard Generation**
Select a note, tap "Make Cards" and Claude generates up to 15 flashcards with difficulty levels and hints. You can also add cards manually if you prefer.

**Study Modes**
- **Flashcards** — tap to flip, swipe left if you missed it, swipe right if you got it
- **Learn** — spaced repetition using the SM-2 algorithm (same one Anki uses). Cards you miss come back sooner, cards you nail get pushed out further
- **Test** — AI-generated multiple choice questions from your flashcard set
- **Match** — tap pairs to match terms with definitions against a timer

**AI Chat**
Ask questions about your notes and get answers grounded in what you actually wrote. It's not just a generic chatbot — it has context of your entire notebook.

**Progress Tracking**
Streaks, accuracy per session, total cards studied, weekly activity view, and a small achievement system to keep things motivating.

---

## Tech stack

| | |
|---|---|
| Framework | Expo SDK 55 + React Native 0.79 |
| Navigation | Expo Router v5 (file-based) |
| Language | TypeScript throughout |
| Backend | Supabase (auth, Postgres, RLS) |
| AI | Anthropic Claude Sonnet 4.6 |
| State | Zustand v5 |
| Animations | React Native Reanimated 3 |
| Gestures | React Native Gesture Handler |
| Styling | NativeWind v4 + custom StyleSheet |

---

## Getting started

You'll need:
- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [Anthropic API key](https://console.anthropic.com)
- Expo Go on your phone, or iOS Simulator / Android Emulator

```bash
git clone https://github.com/briannab1997/bb-study-app
cd bb-study-app
npm install
cp .env.example .env
```

Fill in `.env` with your keys, then run the database schema:

```bash
# In your Supabase project → SQL Editor, run the contents of:
supabase/schema.sql
```

Then enable Email Auth under **Authentication → Providers** in Supabase.

```bash
npm run ios        # or npm run android
```

---

## Project layout

```
bb-study-app/
├── app/
│   ├── (auth)/         # welcome, login, register
│   ├── (tabs)/         # home, library, study hub, profile
│   ├── notebook/       # notebook detail + new notebook
│   ├── flashcards/     # set view + study session
│   └── quiz/           # test mode
├── components/
│   ├── ui/             # Button, Input, Card, Badge, ProgressBar
│   ├── notebook/       # NotebookCard
│   ├── flashcard/      # FlashCard (flip animation), FlashCardSetCard
│   └── common/         # EmptyState, LoadingSpinner, GradientBackground
├── lib/
│   ├── claude.ts       # all AI calls (flashcards, chat, summary, quiz, PDF)
│   ├── supabase.ts     # client + database helpers
│   └── spaced-repetition.ts  # SM-2 algorithm
├── store/              # Zustand stores (auth, notebooks)
├── types/              # TypeScript types + DB schema types
├── constants/          # colors, config
└── supabase/
    └── schema.sql      # full schema with RLS policies + triggers
```

---

## How the AI pieces work

**Flashcard generation** — sends the note content to Claude with a structured JSON prompt. Gets back an array of cards with front, back, hint, and difficulty. The whole thing takes a few seconds.

**PDF import** — picks the file via `expo-document-picker`, reads it as base64 with `expo-file-system`, then sends it directly to Claude as a document. Claude pulls out the text and suggests a title. The result saves as a regular note.

**AI chat** — builds a system prompt that includes all your notebook notes as context, then passes the conversation history. Answers are grounded in what you wrote, not generic knowledge.

**Spaced repetition** — standard SM-2. Ease factor starts at 2.5 and adjusts based on your rating (Again / Hard / Good / Easy). Cards you struggle with surface more often, cards you know well get pushed weeks or months out.

---

## Database

Eight tables in Postgres with row-level security on all of them. A few highlights:
- Triggers automatically update `card_count` on flashcard sets when cards are added/deleted
- Another trigger increments `total_cards_studied` and `total_study_time` on the user profile after each session
- `study_progress` stores the SM-2 state per user per card, with a unique constraint on `(user_id, flashcard_id)`

---

## What's next

Things I want to add when I have time:
- Push notifications for daily study reminders
- Import from Quizlet / Anki
- Collaborative notebooks
- Offline support with local caching
- Apple / Google sign-in

---

## Notes

- The placeholder assets in `assets/images/` need to be replaced with real icons before submitting to the App Store
- The Anthropic API key is called client-side (fine for a portfolio project, move it behind a serverless function before going to production)
- Match game currently supports up to 6 pairs per round to keep the grid readable on smaller phones
