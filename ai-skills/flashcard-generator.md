# Flashcard Generator Skill

## Goal

Turn a student's note or imported study material into concise flashcards that can be reviewed in Luminary's study modes.

## Inputs

- Notebook title
- Note title
- Source note text
- Requested number of cards
- Optional topic focus

## Instructions

- Use only the provided source material.
- Generate cards that test understanding, not memorization alone.
- Avoid duplicate questions.
- Keep answers concise but complete.
- Add a useful hint when the answer might be difficult.
- Label difficulty as `easy`, `medium`, or `hard`.
- If the source content is too thin, generate fewer cards instead of inventing facts.

## Output Shape

Return valid JSON only:

```json
[
  {
    "front": "What is the main purpose of a queue?",
    "back": "A queue stores items in first-in, first-out order.",
    "hint": "Think about waiting in line.",
    "difficulty": "easy",
    "sourceTopic": "Data structures"
  }
]
```

## Quality Checks

- Every card maps back to a sentence, heading, or concept in the source.
- The answer is specific enough to be useful without opening the note.
- The card can stand alone in a study session.
- JSON can be parsed without cleanup.
