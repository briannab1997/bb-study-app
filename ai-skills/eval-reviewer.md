# Eval Reviewer Skill

## Goal

Review generated study content before it is trusted by the app or shown as a high-confidence answer.

## Inputs

- Source note or flashcard set
- Generated output
- Feature type: `summary`, `flashcards`, `quiz`, `tutor-chat`, or `pdf-import`

## Instructions

- Check whether the output is grounded in the provided source.
- Check whether required fields are present.
- Flag unsupported claims.
- Flag vague or low-value study content.
- Flag formatting issues that would break the UI.
- Return a clear pass/fail decision with reasons.

## Output Shape

```json
{
  "feature": "flashcards",
  "passed": true,
  "score": 0.92,
  "findings": [
    "All cards map to source concepts.",
    "One card could use a more specific hint."
  ],
  "recommendedAction": "Keep output and optionally improve hint quality."
}
```

## Quality Checks

- The review is specific enough to guide a fix.
- The score matches the severity of the findings.
- The recommended action is practical.
