import Anthropic from "@anthropic-ai/sdk";
import { Config } from "@/constants/config";
import type { Flashcard, ChatMessage } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // Required for React Native / mobile
});

// ─── Flashcard Generation ──────────────────────────────────────────────────────
export interface GeneratedFlashcard {
  front: string;
  back: string;
  hint?: string;
  difficulty: "easy" | "medium" | "hard";
}

export async function generateFlashcardsFromNote(
  noteContent: string,
  noteTitle: string,
  count = 15
): Promise<GeneratedFlashcard[]> {
  const prompt = `You are an expert educational content creator. Generate ${count} high-quality flashcards from the following study material.

Title: ${noteTitle}

Content:
${noteContent.slice(0, Config.ai.maxContextLength)}

Requirements:
- Create exactly ${count} flashcards
- Mix of difficulty levels (easy, medium, hard)
- Front: Clear, specific question or term
- Back: Concise, accurate answer or definition
- Hint: Optional hint that guides without giving away the answer
- Focus on key concepts, definitions, dates, formulas, and important relationships
- Avoid overly broad or trivial questions

Respond with ONLY valid JSON in this exact format:
{
  "flashcards": [
    {
      "front": "question or term",
      "back": "answer or definition",
      "hint": "optional hint or null",
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}`;

  const message = await anthropic.messages.create({
    model: Config.ai.model,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in Claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as { flashcards: GeneratedFlashcard[] };
  return parsed.flashcards.slice(0, count);
}

// ─── Note Summarization ────────────────────────────────────────────────────────
export async function summarizeNote(
  noteContent: string,
  noteTitle: string
): Promise<string> {
  const prompt = `Create a concise, insightful summary of the following study material.
Focus on the most important concepts, key takeaways, and main ideas.
Keep it under 200 words. Use bullet points for clarity.

Title: ${noteTitle}

Content:
${noteContent.slice(0, Config.ai.maxContextLength)}`;

  const message = await anthropic.messages.create({
    model: Config.ai.model,
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return content.text;
}

// ─── AI Tutor Chat ────────────────────────────────────────────────────────────
export async function chatWithNotes(
  userMessage: string,
  notebookContext: string,
  previousMessages: ChatMessage[]
): Promise<string> {
  const systemPrompt = `${Config.ai.chatSystemPrompt}

Here are the student's notes for context:
---
${notebookContext.slice(0, Config.ai.maxContextLength)}
---

Always reference specific parts of the notes when answering questions. If a question is not covered in the notes, say so and provide general guidance.`;

  // Build conversation history
  const messages: Anthropic.MessageParam[] = [
    ...previousMessages.slice(-10).map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: Config.ai.model,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return content.text;
}

// ─── Generate Quiz Questions ───────────────────────────────────────────────────
export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export async function generateQuizFromFlashcards(
  flashcards: Omit<Flashcard, "id" | "set_id" | "created_at">[],
  count = 10
): Promise<QuizQuestion[]> {
  const cardsText = flashcards
    .slice(0, 30)
    .map((c) => `Q: ${c.front}\nA: ${c.back}`)
    .join("\n\n");

  const prompt = `Generate ${count} multiple-choice quiz questions based on these flashcards.

Flashcards:
${cardsText}

Requirements:
- Each question should test understanding, not just recall
- 4 answer options per question (A, B, C, D)
- One correct answer, three plausible distractors
- Include a brief explanation for why the answer is correct

Respond with ONLY valid JSON:
{
  "questions": [
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}`;

  const message = await anthropic.messages.create({
    model: Config.ai.model,
    max_tokens: 3072,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in Claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as { questions: QuizQuestion[] };
  return parsed.questions.slice(0, count);
}

// ─── Key Concept Extraction ────────────────────────────────────────────────────
export async function extractKeyConcepts(
  noteContent: string
): Promise<string[]> {
  const prompt = `Extract the 5-10 most important key concepts, terms, or ideas from this study material.
Return ONLY a JSON array of strings.
Example: ["photosynthesis", "mitochondria", "ATP synthesis"]

Content:
${noteContent.slice(0, 10000)}`;

  const message = await anthropic.messages.create({
    model: Config.ai.model,
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") return [];

  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  return JSON.parse(jsonMatch[0]) as string[];
}

// ─── PDF Import ────────────────────────────────────────────────────────────────
export interface ImportedPDFNote {
  title: string;
  content: string;
}

export async function importPDFNote(
  base64Data: string,
  filename: string
): Promise<ImportedPDFNote> {
  const message = await anthropic.messages.create({
    model: Config.ai.model,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Data,
            },
          } as any,
          {
            type: "text",
            text: `Extract all the text content from this PDF document. Then suggest a concise, descriptive title based on what the document covers.

Respond with ONLY valid JSON in this exact format:
{
  "title": "A clear title for this document",
  "content": "The full extracted text content goes here"
}`,
          },
        ],
      },
    ],
  });

  const responseContent = message.content[0];
  if (responseContent.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const jsonMatch = responseContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in Claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as ImportedPDFNote;

  // Fall back to the filename if Claude didn't suggest a title
  if (!parsed.title?.trim()) {
    parsed.title = filename.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
  }

  return parsed;
}
