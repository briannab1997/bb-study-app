# Quiz Builder Skill

## Goal

Create multiple-choice questions from a flashcard set so students can test understanding after reviewing.

## Inputs

- Flashcard set title
- Flashcards with front/back content
- Requested question count

## Instructions

- Use the flashcard set as the source of truth.
- Create questions that test the same concepts from a new angle.
- Provide exactly four answer options per question.
- Include one correct answer.
- Make distractors plausible but not unfair.
- Include a short explanation for the correct answer.
- Return valid JSON only.

## Output Shape

```json
[
  {
    "question": "Why is binary search more efficient than linear search on sorted data?",
    "options": [
      "It checks every item twice",
      "It cuts the search area in half after each comparison",
      "It works only on linked lists",
      "It stores data in a queue"
    ],
    "correctAnswer": "It cuts the search area in half after each comparison",
    "explanation": "Binary search repeatedly halves the remaining sorted search space.",
    "sourceCard": "Binary search basics"
  }
]
```

## Quality Checks

- The question can be answered from the flashcards.
- Only one option is clearly correct.
- The explanation teaches instead of simply repeating the answer.
- The JSON structure matches what the quiz UI expects.
