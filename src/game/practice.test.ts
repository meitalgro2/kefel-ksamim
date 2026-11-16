import { it, expect } from 'vitest';
import { lastPracticeText, practiceSummary } from './practice';
import { Attempt } from '../engine/types';

const now = new Date(2026, 10, 16, 20, 0);
const at = (d: Date, session = 's1'): Attempt => ({
  id: Math.random().toString(), child_id: 'c', fact_id: '7x8', session_id: session, timestamp: d.getTime(), mode: 'typed',
  response: 56, correct: true, hint_used: false, response_ms: 3000, scheduled_review: false, due_at_at_attempt: null,
});

it('counts exercises and minutes per day for the last 7 days, ignoring long pauses', () => {
  const t0 = new Date(2026, 10, 16, 17, 0, 0);
  const today = [0, 20, 40, 60, 80, 100].map((s) => at(new Date(t0.getTime() + s * 1000)));
  const afterLongPause = at(new Date(t0.getTime() + 60 * 60 * 1000)); // an hour later, same session
  const yesterday = at(new Date(2026, 10, 15, 9, 0), 's2');
  const old = at(new Date(2026, 10, 1, 9, 0), 's3'); // outside the window
  const p = practiceSummary([...today, afterLongPause, yesterday, old], now);
  expect(p.days.length).toBe(7);
  expect(p.days[6].label).toBe('היום');
  expect(p.days[6].exercises).toBe(7);
  expect(p.days[6].minutes).toBe(4); // 5s + 5×20s + 2min cap ≈ 3.75 -> 4
  expect(p.days[5].exercises).toBe(1);
  expect(p.weekExercises).toBe(8);
  expect(p.weekActiveDays).toBe(2);
  expect(p.totalExercises).toBe(9);
});

it('last practice in plain Hebrew', () => {
  expect(lastPracticeText(null, now)).toBe('עוד לא תרגלו');
  expect(lastPracticeText(new Date(2026, 10, 16, 8).getTime(), now)).toBe('היום');
  expect(lastPracticeText(new Date(2026, 10, 15, 23).getTime(), now)).toBe('אתמול');
  expect(lastPracticeText(new Date(2026, 10, 10).getTime(), now)).toBe('לפני 6 ימים');
});
