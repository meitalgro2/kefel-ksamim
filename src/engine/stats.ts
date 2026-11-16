import { factById } from './facts';
import { ChildFact, isDue } from './mastery';
import { Attempt, Session } from './types';
import { dateKey } from './time';

export type ParentStats = {
  independent: number; // distinct facts ever retrieved typed, correct, no hint
  knownNow: number; // facts currently at recall_1 or above
  delayedSuccess: number; // distinct facts that succeeded in a spaced (delayed) review
  repeatedErrors: { key: string; count: number }[];
  pendingReviews: number;
  trainingDays: number;
  changeSinceDiagnostic: number;
  stars: number; // game reward — NOT learning
};

export function parentStats(
  cfs: ChildFact[],
  attempts: Attempt[],
  sessions: Session[],
  diagnosticBaseline: number,
  now: Date,
): ParentStats {
  const independentKeys = new Set<string>();
  const delayedKeys = new Set<string>();
  const wrongCount = new Map<string, number>();
  const days = new Set<string>();
  for (const at of attempts) {
    const key = factById(at.fact_id).canonical_key;
    days.add(dateKey(new Date(at.timestamp)));
    const indep = at.mode === 'typed' && at.correct && !at.hint_used;
    if (indep) independentKeys.add(key);
    if (indep && at.scheduled_review) delayedKeys.add(key);
    if (!at.correct) wrongCount.set(key, (wrongCount.get(key) ?? 0) + 1);
  }
  const knownNow = cfs.filter((c) => c.mastery_level >= 2).length;
  return {
    independent: independentKeys.size,
    knownNow,
    delayedSuccess: delayedKeys.size,
    repeatedErrors: [...wrongCount.entries()]
      .filter(([, n]) => n >= 2)
      .sort((x, y) => y[1] - x[1])
      .map(([key, count]) => ({ key, count })),
    pendingReviews: cfs.filter((c) => c.status !== 'unseen' && isDue(c, now)).length,
    trainingDays: days.size,
    changeSinceDiagnostic: knownNow - diagnosticBaseline,
    stars: sessions.reduce((s, x) => s + x.stars_earned, 0),
  };
}
