# Luminary Agent Skill Files

These files describe the reusable instructions I would give an AI agent inside Luminary. They are written as lightweight, project-specific skill files so the study workflows stay consistent across flashcard generation, tutor chat, quiz creation, and quality review.

This is not a claim that Luminary uses a full agent framework yet. It is the first step toward formalizing the app's AI behavior with clear inputs, outputs, constraints, and review criteria.

## Skill Files

| File | Purpose |
|---|---|
| `flashcard-generator.md` | Turns study notes into structured flashcards |
| `tutor-chat.md` | Answers student questions using notebook context |
| `quiz-builder.md` | Creates multiple-choice study questions |
| `eval-reviewer.md` | Reviews generated content for quality and grounding |

## Why This Matters

For a study app, the AI output needs to be more than polished. It needs to be useful, grounded in the source material, structured enough for the UI, and safe to use while studying. These skill files make those expectations explicit.
