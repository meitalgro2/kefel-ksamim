import { CANONICAL_KEYS, Fact, factById, factsForKey, tablesOfKey } from './facts';
import { ChildFact, isDue, newChildFact } from './mastery';

export type ItemKind = 'review' | 'lapse' | 'learning' | 'new' | 'maintenance' | 'retry' | 'extra';
export type SessionItem = { factId: string; mode: 'choice' | 'typed'; kind: ItemKind };

export const SESSION_SIZE = 15;
const REVIEW_STATUSES = new Set(['recall_1', 'recall_2', 'consolidating']);

/** Easy tables first when introducing new facts. */
function newFactOrder(key: string): number {
  const tables = tablesOfKey(key);
  const easy = [1, 2, 10, 5, 3, 4, 9, 6, 7, 8];
  return Math.min(...tables.map((t) => easy.indexOf(t))) * 100 + Math.max(...tables.map((t) => easy.indexOf(t)));
}

export function newFactLimit(backlog: number, newToday: number): number {
  const base = backlog < 5 ? 4 : backlog < 10 ? 2 : 0;
  return Math.max(0, base - newToday);
}

export function buildSession(
  cfsIn: Map<string, ChildFact>,
  now: Date,
  newToday: number,
  size = SESSION_SIZE,
  rand: () => number = Math.random,
): SessionItem[] {
  const all = CANONICAL_KEYS.map((k) => cfsIn.get(k) ?? newChildFact('', k));
  const overdue = all
    .filter((c) => REVIEW_STATUSES.has(c.status) && isDue(c, now))
    .sort((x, y) => (x.next_due_at ?? 0) - (y.next_due_at ?? 0));
  const lapses = all.filter((c) => c.status === 'learning' && c.lapse_count > 0);
  const learning = all.filter((c) => c.status === 'learning' && c.lapse_count === 0);
  const backlog = overdue.length + lapses.length;
  const fresh = all
    .filter((c) => c.status === 'unseen')
    .sort((x, y) => newFactOrder(x.canonical_key) - newFactOrder(y.canonical_key))
    .slice(0, newFactLimit(backlog, newToday));
  const maintenance = all.filter((c) => c.status === 'mastered' && isDue(c, now));

  const picked: { key: string; kind: ItemKind }[] = [
    ...overdue.map((c) => ({ key: c.canonical_key, kind: 'review' as const })),
    ...lapses.map((c) => ({ key: c.canonical_key, kind: 'lapse' as const })),
    ...learning.map((c) => ({ key: c.canonical_key, kind: 'learning' as const })),
    ...fresh.map((c) => ({ key: c.canonical_key, kind: 'new' as const })),
    ...maintenance.map((c) => ({ key: c.canonical_key, kind: 'maintenance' as const })),
  ].slice(0, size);

  // Nothing much due: top up with extra (non-advancing) practice of known facts.
  if (picked.length < 6) {
    const used = new Set(picked.map((p) => p.key));
    const extra = all
      .filter((c) => c.status !== 'unseen' && !used.has(c.canonical_key))
      .sort(() => rand() - 0.5)
      .slice(0, 8 - picked.length);
    picked.push(...extra.map((c) => ({ key: c.canonical_key, kind: 'extra' as const })));
  }

  return spread(picked, rand).map(({ key, kind }) => {
    const options = factsForKey(key);
    const fact = options[Math.floor(rand() * options.length)];
    const status = cfsIn.get(key)?.status ?? 'unseen';
    return { factId: fact.id, mode: status === 'unseen' ? 'choice' : 'typed', kind };
  });
}

/** Greedy reorder: keep priority, but avoid the same table twice in a row when possible. */
function spread<T extends { key: string }>(items: T[], _rand: () => number): T[] {
  const rest = [...items];
  const out: T[] = [];
  let prevTables: number[] = [];
  while (rest.length) {
    let idx = rest.findIndex((it) => !tablesOfKey(it.key).some((t) => prevTables.includes(t)));
    if (idx < 0) idx = 0;
    const [it] = rest.splice(idx, 1);
    out.push(it);
    prevTables = tablesOfKey(it.key);
  }
  return out;
}

/** Re-ask a missed fact after 3–5 other items (typed). Returns a new queue. */
export function insertRetry(queue: SessionItem[], currentIndex: number, factId: string, rand: () => number = Math.random): SessionItem[] {
  const gap = 3 + Math.floor(rand() * 3);
  const pos = Math.min(queue.length, currentIndex + 1 + gap);
  const key = factById(factId).canonical_key;
  const q = [...queue];
  // drop a later duplicate of the same key so it isn't asked twice more
  for (let i = q.length - 1; i > currentIndex; i--) if (factById(q[i].factId).canonical_key === key) q.splice(i, 1);
  q.splice(Math.min(pos, q.length), 0, { factId, mode: 'typed', kind: 'retry' });
  return q;
}

/** Four distinct multiple-choice options including the answer, shuffled. */
export function choiceOptions(fact: Fact, rand: () => number = Math.random): number[] {
  const { a, b, answer } = fact;
  const pool = [(a + 1) * b, (a - 1) * b, a * (b + 1), a * (b - 1), a + b, answer + 10, answer - 10, answer + 2, answer - 1];
  const opts = new Set<number>([answer]);
  for (const v of pool.sort(() => rand() - 0.5)) {
    if (opts.size >= 4) break;
    if (v > 0 && v !== answer) opts.add(v);
  }
  let k = 1;
  while (opts.size < 4) opts.add(answer + k++);
  return [...opts].sort(() => rand() - 0.5);
}
