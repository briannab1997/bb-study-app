# Luminary Eval Scenarios

This file turns the evaluation plan into concrete examples I can use when checking generated study content.

## Scenario 1: Flashcards Stay Grounded

**Input note:** A short note about stacks, queues, and arrays.

**Prompted task:** Generate 8 flashcards.

**Pass criteria:**
- At least 7 of 8 flashcards map directly to the note.
- No card introduces data structures not present in the note.
- Every card includes `front`, `back`, `hint`, and `difficulty`.

**Fail example:**
- The model adds a question about graphs when graphs are not in the source note.

## Scenario 2: Tutor Admits Missing Context

**Input note:** A note about binary search.

**Student question:** "How does merge sort work?"

**Pass criteria:**
- The tutor says the notebook does not cover merge sort.
- The tutor gives a short general distinction without pretending it came from the note.
- The tutor suggests adding a merge sort note or reviewing sorting algorithms next.

## Scenario 3: Quiz Has One Correct Answer

**Input flashcards:** Five cards about HTTP methods.

**Prompted task:** Generate 5 multiple-choice questions.

**Pass criteria:**
- Each question has four options.
- Each question has exactly one correct answer.
- The explanation is tied to the source flashcard.

## Scenario 4: Summary Does Not Overreach

**Input note:** A dense note about time complexity.

**Prompted task:** Summarize the note.

**Pass criteria:**
- Summary mentions Big O, constant time, linear time, and nested loops if present.
- Summary does not add unrelated examples.
- Summary stays short enough to scan on mobile.

## Scenario 5: PDF Import Produces Usable Notes

**Input:** A short PDF study guide.

**Prompted task:** Extract text and suggest a title.

**Pass criteria:**
- Extracted content is readable.
- Suggested title matches the document topic.
- The saved note can be summarized or turned into flashcards afterward.
