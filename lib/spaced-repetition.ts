/**
 * SM-2 (SuperMemo 2) Spaced Repetition Algorithm
 * The algorithm used by Anki and many other flashcard apps.
 *
 * Quality ratings:
 *   0 - Complete blackout
 *   1 - Incorrect, but answer remembered when shown
 *   2 - Incorrect, but answer was easy to recall when shown
 *   3 - Correct, with serious difficulty
 *   4 - Correct, with hesitation
 *   5 - Perfect recall
 */

import type { StudyProgress, StudyQuality } from "@/types";
import { Config } from "@/constants/config";
import { addDays, parseISO } from "date-fns";

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
}

/**
 * Calculate the next review date using SM-2 algorithm
 */
export function calculateNextReview(
  currentProgress: Partial<StudyProgress>,
  quality: StudyQuality
): SM2Result {
  const {
    ease_factor = Config.study.defaultEaseFactor,
    interval = Config.study.initialInterval,
    repetitions = 0,
  } = currentProgress;

  // If quality < 3, reset the card (failed to recall)
  if (quality < 3) {
    return {
      easeFactor: ease_factor,
      interval: Config.study.initialInterval,
      repetitions: 0,
      nextReview: addDays(new Date(), Config.study.initialInterval),
    };
  }

  // Calculate new ease factor
  const newEaseFactor = Math.max(
    Config.study.minEaseFactor,
    ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  // Calculate new interval
  let newInterval: number;
  if (repetitions === 0) {
    newInterval = Config.study.initialInterval;
  } else if (repetitions === 1) {
    newInterval = Config.study.graduatingInterval;
  } else {
    newInterval = Math.round(interval * newEaseFactor);
  }

  // Cap interval at 365 days
  newInterval = Math.min(newInterval, 365);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: repetitions + 1,
    nextReview: addDays(new Date(), newInterval),
  };
}

/**
 * Get cards due for review today
 */
export function getDueCards<T extends { next_review: string }>(cards: T[]): T[] {
  const now = new Date();
  return cards.filter((card) => parseISO(card.next_review) <= now);
}

/**
 * Calculate study score percentage
 */
export function calculateScore(
  results: Array<{ quality: StudyQuality }>
): number {
  if (results.length === 0) return 0;
  const correctCount = results.filter((r) => r.quality >= 3).length;
  return Math.round((correctCount / results.length) * 100);
}

/**
 * Determine card difficulty label from ease factor
 */
export function getDifficultyLabel(easeFactor: number): string {
  if (easeFactor < 1.8) return "Hard";
  if (easeFactor < 2.3) return "Medium";
  return "Easy";
}

/**
 * Get the next interval description for display
 */
export function getIntervalDescription(interval: number): string {
  if (interval === 0) return "Again soon";
  if (interval === 1) return "Tomorrow";
  if (interval < 7) return `${interval} days`;
  if (interval < 30) return `${Math.round(interval / 7)} weeks`;
  if (interval < 365) return `${Math.round(interval / 30)} months`;
  return `${Math.round(interval / 365)} year${interval >= 730 ? "s" : ""}`;
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calculate streak from study sessions
 */
export function calculateStreak(sessionDates: Date[]): number {
  if (sessionDates.length === 0) return 0;

  const sorted = [...sessionDates].sort((a, b) => b.getTime() - a.getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = today;

  for (const date of sorted) {
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0 || diffDays === 1) {
      streak++;
      currentDate = sessionDate;
    } else {
      break;
    }
  }

  return streak;
}
