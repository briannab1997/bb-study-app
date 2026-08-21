# Luminary AI Evaluation Plan

Luminary uses AI for flashcard generation, note summaries, quiz questions, PDF note extraction, and tutor chat. This evaluation plan explains how I check whether those features are useful, grounded, and safe enough for a study workflow.

## What I Evaluate

### Flashcard Generation

Goal: Turn source notes into accurate, useful study cards.

Checks:
- Cards are based on the provided note content.
- Questions are specific instead of vague.
- Answers are concise and correct.
- Difficulty labels make sense.
- The response returns valid JSON that the app can parse.

Sample pass condition:
At least 90% of generated cards should clearly map back to the source note.

### AI Summaries

Goal: Help the student review a note quickly without losing the main ideas.

Checks:
- Summary includes the highest-value concepts.
- Summary does not introduce unsupported facts.
- Summary stays short enough to scan.
- Formatting is readable on mobile and web.

Sample pass condition:
The summary should cover the main topics and avoid claims not present in the original note.

### AI Tutor Chat

Goal: Answer questions using the student's notebook context.

Checks:
- Answer references the note content when available.
- If the answer is not in the notes, the tutor says so instead of pretending.
- The tone is clear, encouraging, and student-friendly.
- The answer suggests a helpful next study step.

Sample pass condition:
Tutor answers should be grounded in the notebook context and should not overstate certainty.

### Quiz Generation

Goal: Create multiple-choice questions that test understanding.

Checks:
- Each question has four options.
- Only one answer is correct.
- Distractors are plausible but not misleading.
- Explanation teaches why the answer is correct.
- JSON format remains valid.

Sample pass condition:
Questions should be answerable from the flashcards and should include a useful explanation.

## Regression Test Set

I keep a small set of sample notes for manual regression checks:

| Scenario | Input | Expected Behavior |
|---|---|---|
| Short biology note | Photosynthesis concepts | Generates cards about chlorophyll, sunlight, glucose, and oxygen |
| Dense exam note | Data structures notes | Summary identifies arrays, stacks, queues, trees, and tradeoffs |
| Missing context question | Ask about a topic not in notes | Tutor explains that the notes do not cover it |
| PDF import | Uploaded study guide | Extracts readable note content and suggests a relevant title |
| Quiz mode | Flashcards from one set | Produces valid multiple-choice questions with explanations |

## Future Improvements

- Add automated schema validation for every AI JSON response.
- Save AI generations with model, prompt version, and timestamp.
- Add a small scoring dashboard for pass/fail eval runs.
- Compare outputs across model versions before changing production prompts.
- Add retrieval scoring when notebook search grows beyond simple context injection.
