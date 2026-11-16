// Glue between the learning engine, storage and the screens.
import * as repo from '../db/repo';
import { factById, factsForKey, tablesOfKey, CANONICAL_KEYS } from '../engine/facts';
import { applyAttempt, ChildFact, isDue, isScheduledReview, newChildFact } from '../engine/mastery';
import { buildSession, newFactLimit, SessionItem } from '../engine/selector';
import { Attempt, Child, Reward, Session, SessionType, uid } from '../engine/types';
import { dateKey } from '../engine/time';

export type ChildState = {
  child: Child;
  cfs: Map<string, ChildFact>;
  attempts: Attempt[];
  sessions: Session[];
  rewards: Reward[];
};

export async function loadChildState(childId: string): Promise<ChildState | null> {
  const child = await repo.getChild(childId);
  if (!child) return null;
  const [cfs, attempts, sessions, rewards] = await Promise.all([
    repo.getChildFacts(childId),
    repo.getAttempts(childId),
    repo.getSessions(childId),
    repo.getRewards(childId),
  ]);
  return { child, cfs, attempts, sessions, rewards };
}

/** Canonical facts first met today outside the diagnostic. */
export function newTodayCount(st: ChildState, now: Date): number {
  const diag = new Set(st.sessions.filter((s) => s.type === 'diagnostic').map((s) => s.id));
  const first = new Map<string, Attempt>();
  for (const a of st.attempts) {
    const k = factById(a.fact_id).canonical_key;
    if (!first.has(k)) first.set(k, a);
  }
  const today = dateKey(now);
  let n = 0;
  for (const a of first.values()) if (!diag.has(a.session_id) && dateKey(new Date(a.timestamp)) === today) n++;
  return n;
}

export function dueCount(st: ChildState, now: Date): number {
  return [...st.cfs.values()].filter((c) => c.status !== 'unseen' && isDue(c, now)).length;
}

export function totalStars(st: ChildState): number {
  return st.sessions.reduce((s, x) => s + x.stars_earned, 0);
}

export function trainingDays(st: ChildState): number {
  return new Set(st.attempts.map((a) => dateKey(new Date(a.timestamp)))).size;
}

export function makeQueue(kind: SessionType, st: ChildState, now: Date, table?: number): SessionItem[] {
  const newToday = newTodayCount(st, now);
  if (kind === 'daily') return buildSession(st.cfs, now, newToday);
  if (table) {
    // practice one table; unseen facts only within today's new-fact allowance
    let allowNew = newFactLimit(0, newToday);
    const keys = CANONICAL_KEYS.filter((k) => tablesOfKey(k).includes(table));
    const items: SessionItem[] = [];
    for (const k of keys.sort(() => Math.random() - 0.5)) {
      const status = st.cfs.get(k)?.status ?? 'unseen';
      if (status === 'unseen') {
        if (allowNew <= 0) continue;
        allowNew--;
      }
      const opts = factsForKey(k);
      const f = opts.find((o) => o.a === table) ?? opts[0];
      items.push({ factId: f.id, mode: kind === 'typed_game' && status !== 'unseen' ? 'typed' : 'choice', kind: 'extra' });
    }
    return items.slice(0, 10);
  }
  const base = buildSession(st.cfs, now, newToday, 10);
  return base.map((it) => ({ ...it, mode: kind === 'choice_game' ? 'choice' : it.mode }));
}

export async function startSession(childId: string, type: SessionType): Promise<Session> {
  const s: Session = {
    id: uid(), child_id: childId, started_at: Date.now(), finished_at: null, type,
    items_seen: 0, independent_correct: 0, stars_earned: 0,
  };
  await repo.saveSession(s);
  return s;
}

export type AnswerResult = { correct: boolean; advanced: boolean; lapse: boolean; stars: number; saved: boolean };

/** Score one answer, update the fact, and persist everything atomically. Mutates st & session. */
export async function submitAnswer(
  st: ChildState,
  session: Session,
  item: { factId: string; mode: 'choice' | 'typed' },
  response: number | null,
  hintUsed: boolean,
  responseMs: number,
  attemptId: string,
  now = new Date(),
): Promise<AnswerResult> {
  const fact = factById(item.factId);
  const correct = response === fact.answer;
  const before = st.cfs.get(fact.canonical_key) ?? newChildFact(st.child.id, fact.canonical_key, now.getTime());
  const scheduled = isScheduledReview(before, now);
  const r = applyAttempt(before, { mode: item.mode, correct, hint_used: hintUsed }, now);
  const attempt: Attempt = {
    id: attemptId, child_id: st.child.id, fact_id: fact.id, session_id: session.id, timestamp: now.getTime(),
    mode: item.mode, response, correct, hint_used: hintUsed, response_ms: Math.round(responseMs),
    scheduled_review: scheduled, due_at_at_attempt: before.next_due_at,
  };
  const stars = session.type === 'diagnostic' ? 0 : correct ? 1 : 0;
  const nextSession: Session = {
    ...session,
    items_seen: session.items_seen + 1,
    independent_correct: session.independent_correct + (correct && item.mode === 'typed' && !hintUsed ? 1 : 0),
    stars_earned: session.stars_earned + stars,
  };
  const saved = await repo.recordAttempt(attempt, r.cf, nextSession);
  if (saved) {
    st.cfs.set(fact.canonical_key, r.cf);
    st.attempts.push(attempt);
    Object.assign(session, nextSession);
    const i = st.sessions.findIndex((s) => s.id === session.id);
    if (i >= 0) st.sessions[i] = { ...session };
    else st.sessions.push({ ...session });
  }
  return { correct, advanced: r.advanced, lapse: r.lapse, stars: saved ? stars : 0, saved };
}

export const FINISH_BONUS = 3;

export async function finishSession(st: ChildState, session: Session): Promise<void> {
  if (session.finished_at) return;
  session.finished_at = Date.now();
  if (session.items_seen >= 5) session.stars_earned += session.type === 'diagnostic' ? 5 : FINISH_BONUS;
  await repo.saveSession({ ...session });
  const i = st.sessions.findIndex((s) => s.id === session.id);
  if (i >= 0) st.sessions[i] = { ...session };
}

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`kefel:${pin}`);
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0;
  for (const b of data) h = (h * 31 + b) | 0;
  return `weak${h}`;
}
