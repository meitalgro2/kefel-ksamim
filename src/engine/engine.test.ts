import { describe, it, expect } from 'vitest';
import { hintFor } from './hints';
import { nextDiagnosticItem, DiagResult, MAX_DIAGNOSTIC } from './diagnostic';
import { buildSession, insertRetry, choiceOptions } from './selector';
import { applyAttempt, ChildFact, newChildFact } from './mastery';
import { CANONICAL_KEYS, FACTS, factById } from './facts';
import { parentStats } from './stats';
import { Attempt } from './types';
import { addDays } from './time';

const now = new Date(2026, 10, 16, 17, 0);

function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

describe('hints', () => {
  it('×9 uses ten-minus, 7×8 splits to 56', () => {
    expect(hintFor(9, 7).strategy).toBe('ten_minus');
    const h = hintFor(7, 8);
    expect(h.strategy).toBe('split');
    expect(h.steps.at(-1)).toContain('56');
  });
  it('every fact gets a hint whose last step shows the product', () => {
    for (const f of FACTS) expect(hintFor(f.a, f.b).steps.join(' ')).toContain(String(f.answer));
  });
});

describe('diagnostic', () => {
  it('acceptance 8: stops at 24 at most, even with all wrong', () => {
    const res: DiagResult[] = [];
    for (let i = 0; i < 40; i++) {
      const f = nextDiagnosticItem(res, seeded(i + 1));
      if (!f) break;
      res.push({ factId: f.id, correct: false });
    }
    expect(res.length).toBe(MAX_DIAGNOSTIC);
    expect(new Set(res.map((r) => factById(r.factId).canonical_key)).size).toBe(res.length);
  });
  it('a strong child gets 16 items', () => {
    const res: DiagResult[] = [];
    for (let f = nextDiagnosticItem(res); f; f = nextDiagnosticItem(res)) res.push({ factId: f.id, correct: true });
    expect(res.length).toBe(16);
  });
  it('acceptance 9: untested facts stay unseen after diagnostic', () => {
    const map = new Map<string, ChildFact>();
    const res: DiagResult[] = [];
    for (let f = nextDiagnosticItem(res); f; f = nextDiagnosticItem(res)) {
      res.push({ factId: f.id, correct: true });
      const cf = map.get(f.canonical_key) ?? newChildFact('c', f.canonical_key);
      map.set(f.canonical_key, applyAttempt(cf, { mode: 'typed', correct: true, hint_used: false }, now).cf);
    }
    const untested = CANONICAL_KEYS.filter((k) => !map.has(k));
    expect(untested.length).toBe(55 - 16);
    expect([...map.values()].every((c) => c.status === 'recall_1')).toBe(true); // not mastered
  });
});

describe('selector', () => {
  it('priority: overdue before lapses before new; new limited', () => {
    const m = new Map<string, ChildFact>();
    const due = { ...newChildFact('c', '3x7'), status: 'recall_2' as const, mastery_level: 3, next_due_at: addDays(now, -2).getTime() };
    const lapse = { ...newChildFact('c', '6x8'), status: 'learning' as const, mastery_level: 1, lapse_count: 1, next_due_at: now.getTime() };
    m.set(due.canonical_key, due);
    m.set(lapse.canonical_key, lapse);
    const s = buildSession(m, now, 0, 15, seeded(3));
    const keys = s.map((i) => factById(i.factId).canonical_key);
    expect(keys.indexOf('3x7')).toBeLessThan(keys.indexOf('6x8'));
    expect(s.filter((i) => i.kind === 'new').length).toBe(4);
    expect(s.filter((i) => i.kind === 'new').every((i) => i.mode === 'choice')).toBe(true);
    expect(s.find((i) => i.kind === 'review')!.mode).toBe('typed');
  });

  it('review focus 5: 50 overdue -> 15 items, no new facts', () => {
    const m = new Map<string, ChildFact>();
    for (const k of CANONICAL_KEYS.slice(0, 50)) {
      m.set(k, { ...newChildFact('c', k), status: 'recall_1', mastery_level: 2, next_due_at: addDays(now, -30).getTime() });
    }
    const s = buildSession(m, now, 0);
    expect(s.length).toBe(15);
    expect(s.some((i) => i.kind === 'new')).toBe(false);
  });

  it('new limit respects facts already introduced today', () => {
    const s = buildSession(new Map(), now, 3, 15, seeded(2));
    expect(s.filter((i) => i.kind === 'new').length).toBe(1);
  });

  it('retry lands 3-5 items later, never adjacent', () => {
    const q = buildSession(new Map(), now, 0, 15, seeded(5));
    const q2 = insertRetry(
      [...q, ...q.map((x) => ({ ...x, factId: '9x9', kind: 'extra' as const }))].slice(0, 10),
      0,
      q[0].factId,
      () => 0,
    );
    expect(q2[4].kind).toBe('retry');
  });

  it('retry near the end of a session is not asked immediately', () => {
    const q = buildSession(new Map(), now, 0, 15, seeded(5)).slice(0, 4);
    const last = q.length - 2; // only one item after the current one
    const q2 = insertRetry(q, last, q[last].factId, () => 0.99);
    expect(q2.some((i) => i.kind === 'retry')).toBe(false);
    const q3 = insertRetry([...q, ...q, ...q].slice(0, 9), 2, q[2].factId, () => 0.99);
    const at = q3.findIndex((i) => i.kind === 'retry');
    expect(at - 2 - 1).toBeGreaterThanOrEqual(3);
    expect(at - 2 - 1).toBeLessThanOrEqual(5);
  });

  it('choice options: 4 unique, include answer, all positive', () => {
    for (const f of FACTS) {
      const o = choiceOptions(f, seeded(7));
      expect(new Set(o).size).toBe(4);
      expect(o).toContain(f.answer);
      expect(o.every((v) => v > 0)).toBe(true);
    }
  });
});

describe('parent stats', () => {
  it('acceptance 10: stars are separate from delayed recall', () => {
    const mk = (over: Partial<Attempt>): Attempt => ({
      id: Math.random().toString(), child_id: 'c', fact_id: '7x8', session_id: 's', timestamp: now.getTime(),
      mode: 'typed', response: 56, correct: true, hint_used: false, response_ms: 1000, scheduled_review: false,
      due_at_at_attempt: null, ...over,
    });
    const attempts = [mk({}), mk({ fact_id: '8x7', scheduled_review: true, timestamp: addDays(now, 1).getTime() }), mk({ mode: 'choice', fact_id: '3x3' })];
    const st = parentStats([], attempts, [{ id: 's', child_id: 'c', started_at: 0, finished_at: 1, type: 'daily', items_seen: 3, independent_correct: 2, stars_earned: 50 }], 0, now);
    expect(st.stars).toBe(50);
    expect(st.independent).toBe(1); // 7x8 and 8x7 = one canonical fact; choice doesn't count
    expect(st.delayedSuccess).toBe(1);
    expect(st.trainingDays).toBe(2);
  });
});
