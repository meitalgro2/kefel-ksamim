import { addDays, dateKey, startOfDay } from './time';

export const STATUSES = ['unseen', 'learning', 'recall_1', 'recall_2', 'consolidating', 'mastered'] as const;
export type Status = (typeof STATUSES)[number];

export type ChildFact = {
  child_id: string;
  canonical_key: string;
  status: Status;
  mastery_level: number; // index in STATUSES, 0..5
  confidence: number; // 0..1, derived from level
  next_due_at: number | null; // epoch ms, always a local start-of-day
  last_reviewed_at: number | null;
  last_success_date: string | null; // YYYY-MM-DD of last independent success
  consecutive_delayed_successes: number;
  lapse_count: number;
  preferred_strategy_id: string | null;
  updated_at: number;
  last_fail_date?: string | null; // YYYY-MM-DD of last wrong/hinted answer
};

export type AttemptInput = { mode: 'choice' | 'typed'; correct: boolean; hint_used: boolean };

/** Days until next review after reaching a status by a successful retrieval. Calibratable. */
export const INTERVAL_DAYS: Record<Status, number> = {
  unseen: 0,
  learning: 0,
  recall_1: 1,
  recall_2: 3,
  consolidating: 7,
  mastered: 14,
};
export const MAINTENANCE_DAYS = 30;

export function newChildFact(childId: string, key: string, now = Date.now()): ChildFact {
  return {
    child_id: childId,
    canonical_key: key,
    status: 'unseen',
    mastery_level: 0,
    confidence: 0,
    next_due_at: null,
    last_reviewed_at: null,
    last_success_date: null,
    consecutive_delayed_successes: 0,
    lapse_count: 0,
    preferred_strategy_id: null,
    updated_at: now,
  };
}

export function isDue(cf: ChildFact, now: Date): boolean {
  return cf.next_due_at !== null && cf.next_due_at <= now.getTime();
}

/**
 * A genuine delayed review: the fact is at a review stage, is due, and was not
 * already seen today (so an in-session retry after a lapse can never count).
 */
export function isScheduledReview(cf: ChildFact, now: Date): boolean {
  const failedToday = cf.last_fail_date === dateKey(now);
  return cf.mastery_level >= 2 && isDue(cf, now) && !failedToday;
}

function withStatus(cf: ChildFact, status: Status): ChildFact {
  const level = STATUSES.indexOf(status);
  return { ...cf, status, mastery_level: level, confidence: Math.max(0, (level - 1) / 4) };
}

export function applyAttempt(
  cf: ChildFact,
  a: AttemptInput,
  now: Date,
): { cf: ChildFact; lapse: boolean; advanced: boolean } {
  const t = now.getTime();
  let next: ChildFact = { ...cf, last_reviewed_at: t, updated_at: t };
  const independent = a.mode === 'typed' && a.correct && !a.hint_used;
  const today = startOfDay(now);

  // Failure: wrong answer (any mode) or a hint was used.
  if (!a.correct || a.hint_used) {
    next.last_fail_date = dateKey(now);
    if (cf.status === 'unseen' || cf.status === 'learning') {
      next = withStatus(next, 'learning');
      next.next_due_at = today.getTime();
      return { cf: next, lapse: false, advanced: false };
    }
    const lower = STATUSES[STATUSES.indexOf(cf.status) - 1];
    next = withStatus(next, lower);
    next.lapse_count = cf.lapse_count + 1;
    next.consecutive_delayed_successes = 0;
    next.next_due_at = today.getTime(); // due again from the next session onward
    return { cf: next, lapse: true, advanced: false };
  }

  // Correct but not independent (multiple choice): exposure only.
  if (!independent) {
    if (cf.status === 'unseen') {
      next = withStatus(next, 'learning');
      next.next_due_at = today.getTime();
    }
    return { cf: next, lapse: false, advanced: false };
  }

  // Independent retrieval of a new / learning fact.
  if (cf.status === 'unseen' || cf.status === 'learning') {
    next = withStatus(next, 'recall_1');
    next.next_due_at = addDays(today, INTERVAL_DAYS.recall_1).getTime();
    next.last_success_date = dateKey(now);
    return { cf: next, lapse: false, advanced: true };
  }

  if (!isScheduledReview(cf, now)) {
    // Early success, or a same-day retry after a lapse: never shortens or skips the schedule.
    return { cf: next, lapse: false, advanced: false };
  }

  const nextStatus: Status = cf.status === 'mastered' ? 'mastered' : STATUSES[STATUSES.indexOf(cf.status) + 1];
  const days = cf.status === 'mastered' ? MAINTENANCE_DAYS : INTERVAL_DAYS[nextStatus];
  next = withStatus(next, nextStatus);
  next.next_due_at = addDays(today, days).getTime();
  next.last_success_date = dateKey(now);
  next.consecutive_delayed_successes = cf.consecutive_delayed_successes + 1;
  return { cf: next, lapse: false, advanced: true };
}
