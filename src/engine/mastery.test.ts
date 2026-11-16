import { describe, it, expect } from 'vitest';
import { applyAttempt, newChildFact } from './mastery';
import { addDays, startOfDay } from './time';

const day0 = new Date(2026, 10, 16, 17, 0, 0);
const typedOk = { mode: 'typed' as const, correct: true, hint_used: false };
const choiceOk = { mode: 'choice' as const, correct: true, hint_used: false };
const wrong = { mode: 'typed' as const, correct: false, hint_used: false };

describe('mastery state machine', () => {
  it('acceptance 1: correct multiple-choice never advances to recall', () => {
    let cf = newChildFact('c1', '7x8');
    for (let i = 0; i < 10; i++) cf = applyAttempt(cf, choiceOk, addDays(day0, i)).cf;
    expect(['unseen', 'learning']).toContain(cf.status);
    expect(cf.mastery_level).toBeLessThanOrEqual(1);
  });

  it('acceptance 2: typed correct no-hint on unseen -> recall_1 due tomorrow', () => {
    const r = applyAttempt(newChildFact('c1', '7x8'), typedOk, day0);
    expect(r.cf.status).toBe('recall_1');
    expect(r.cf.next_due_at).toBe(addDays(startOfDay(day0), 1).getTime());
  });

  it('hint blocks advancement', () => {
    const r = applyAttempt(newChildFact('c1', '7x8'), { ...typedOk, hint_used: true }, day0);
    expect(r.cf.status).toBe('learning');
    expect(r.advanced).toBe(false);
  });

  it('acceptance 3: many same-day successes do not skip reviews', () => {
    let cf = applyAttempt(newChildFact('c1', '7x8'), typedOk, day0).cf;
    const due = cf.next_due_at;
    for (let i = 1; i <= 5; i++) cf = applyAttempt(cf, typedOk, new Date(day0.getTime() + i * 60000)).cf;
    expect(cf.status).toBe('recall_1');
    expect(cf.next_due_at).toBe(due);
    cf = applyAttempt(cf, typedOk, new Date(2026, 10, 16, 23, 59)).cf; // just before midnight
    expect(cf.status).toBe('recall_1');
  });

  it('delayed successes climb 1 -> 3 -> 7 -> 14 -> 30 days', () => {
    let cf = applyAttempt(newChildFact('c1', '7x8'), typedOk, day0).cf;
    const steps: [string, number][] = [['recall_2', 3], ['consolidating', 7], ['mastered', 14], ['mastered', 30]];
    for (const [status, days] of steps) {
      const at = new Date(cf.next_due_at! + 10 * 3600 * 1000);
      cf = applyAttempt(cf, typedOk, at).cf;
      expect(cf.status).toBe(status);
      expect(cf.next_due_at).toBe(addDays(startOfDay(at), days).getTime());
    }
    expect(cf.consecutive_delayed_successes).toBe(4);
  });

  it('acceptance 4: wrong answer schedules review and keeps history', () => {
    let cf = applyAttempt(newChildFact('c1', '7x8'), typedOk, day0).cf;
    cf = applyAttempt(cf, typedOk, new Date(cf.next_due_at! + 3600e3)).cf; // recall_2
    const lastSuccess = cf.last_success_date;
    const at = new Date(cf.next_due_at! + 3600e3);
    const r = applyAttempt(cf, wrong, at);
    expect(r.lapse).toBe(true);
    expect(r.cf.status).toBe('recall_1'); // dropped one level, not reset
    expect(r.cf.lapse_count).toBe(1);
    expect(r.cf.last_success_date).toBe(lastSuccess);
    expect(r.cf.next_due_at).toBeLessThanOrEqual(at.getTime());
  });
});
