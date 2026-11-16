import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import * as repo from './repo';
import { applyAttempt, newChildFact } from '../engine/mastery';
import { Attempt, Child } from '../engine/types';

const child = (id: string): Child => ({
  id, parent_id: 'parent', nickname: id, age_band: '8-10', avatar_id: 'ember', created_at: Date.now(),
  settings: { reduceMotion: false, readAloud: false, diagnosticDone: false, diagnosticBaseline: 0 },
});
const attempt = (id: string, childId: string, factId = '7x8'): Attempt => ({
  id, child_id: childId, fact_id: factId, session_id: 's1', timestamp: Date.now(), mode: 'typed',
  response: 56, correct: true, hint_used: false, response_ms: 900, scheduled_review: false, due_at_at_attempt: null,
});

beforeEach(async () => {
  await repo.wipeEverything();
});

describe('repo', () => {
  it('review focus 1: recording the same attempt twice stores it once', async () => {
    await repo.saveChild(child('a'));
    const cf = applyAttempt(newChildFact('a', '7x8'), { mode: 'typed', correct: true, hint_used: false }, new Date()).cf;
    expect(await repo.recordAttempt(attempt('x1', 'a'), cf)).toBe(true);
    expect(await repo.recordAttempt(attempt('x1', 'a'), cf)).toBe(false);
    expect((await repo.getAttempts('a')).length).toBe(1);
  });

  it('acceptance 6 / review focus 2: attempts survive closing the app mid-session', async () => {
    await repo.saveChild(child('a'));
    const cf = newChildFact('a', '7x8');
    await repo.recordAttempt(attempt('x1', 'a'), cf);
    await repo.recordAttempt(attempt('x2', 'a', '3x4'), newChildFact('a', '3x4'));
    await repo.closeDb(); // simulate reload
    expect((await repo.getAttempts('a')).length).toBe(2);
    expect((await repo.getChildFacts('a')).size).toBe(2);
  });

  it('acceptance 7: two children never mix data; delete cascades only one', async () => {
    await repo.saveChild(child('a'));
    await repo.saveChild(child('b'));
    await repo.recordAttempt(attempt('x1', 'a'), newChildFact('a', '7x8'));
    await repo.recordAttempt(attempt('y1', 'b'), newChildFact('b', '7x8'));
    expect((await repo.getAttempts('a')).map((x) => x.id)).toEqual(['x1']);
    expect((await repo.getChildFacts('b')).get('7x8')!.child_id).toBe('b');
    await repo.deleteChild('a');
    expect(await repo.listChildren()).toHaveLength(1);
    expect(await repo.getAttempts('a')).toHaveLength(0);
    expect(await repo.getAttempts('b')).toHaveLength(1);
  });

  it('rejects an attempt whose fact belongs to another child', async () => {
    await expect(repo.recordAttempt(attempt('z', 'a'), newChildFact('b', '7x8'))).rejects.toThrow();
  });

  it('backup round-trip, and a bad file changes nothing', async () => {
    await repo.saveChild(child('a'));
    await repo.recordAttempt(attempt('x1', 'a'), newChildFact('a', '7x8'));
    const backup = JSON.parse(JSON.stringify(await repo.exportAll()));
    await expect(repo.importAll({ hello: 1 })).rejects.toThrow();
    expect(await repo.listChildren()).toHaveLength(1);
    await repo.deleteChild('a');
    await repo.importAll(backup);
    expect((await repo.getAttempts('a')).length).toBe(1);
  });
});
