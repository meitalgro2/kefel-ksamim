import { describe, it, expect } from 'vitest';
import { bagsAvailable, bagsEarned, CARDS, cardRewardType, drawCard, ownedCounts, rollRarity } from './cards';
import { Reward, Session } from '../engine/types';

function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
const reward = (id: string): Reward => ({ id: Math.random().toString(), child_id: 'c', reward_type: cardRewardType(id), earned_at: 0, source_session_id: 's' });
const daily = (day: number, items = 8): Session => ({
  id: `d${day}-${Math.random()}`, child_id: 'c', started_at: 0, finished_at: new Date(2026, 10, day, 18).getTime(),
  type: 'daily', items_seen: items, independent_correct: 0, stars_earned: 0,
});

describe('squishy cards', () => {
  it('has 30 unique cards: 18 common, 9 rare, 3 legendary', () => {
    expect(CARDS.length).toBe(30);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(30);
    expect(CARDS.filter((c) => c.rarity === 'common').length).toBe(18);
    expect(CARDS.filter((c) => c.rarity === 'rare').length).toBe(9);
    expect(CARDS.filter((c) => c.rarity === 'legendary').length).toBe(3);
  });

  it('bags: one per 10 stars plus one bonus per day with a finished daily session', () => {
    const sessions = [daily(16), daily(16), daily(17), daily(18, 3)]; // two days count; a 3-item session doesn't
    expect(bagsEarned(25, sessions)).toBe(2 + 2);
    expect(bagsAvailable(25, sessions, [reward('s01'), reward('s02')])).toBe(2);
    expect(bagsAvailable(5, [], [reward('s01')])).toBe(0); // never negative
  });

  it('first 5 bags are always new cards', () => {
    for (let seed = 1; seed < 200; seed++) {
      const rand = seeded(seed);
      const owned = new Map<string, number>();
      for (let i = 0; i < 5; i++) {
        const c = drawCard(owned, i, null, rand);
        expect(owned.has(c.id)).toBe(false);
        owned.set(c.id, 1);
      }
    }
  });

  it('never gives the same card twice in a row', () => {
    const rand = seeded(9);
    const owned = new Map(CARDS.map((c) => [c.id, 1] as const)); // has everything
    let last: string | null = null;
    for (let i = 0; i < 500; i++) {
      const c = drawCard(owned, 10 + i, last, rand);
      expect(c.id).not.toBe(last);
      last = c.id;
    }
  });

  it('rarity odds: 5% legendary, 25% rare, 70% common', () => {
    expect(rollRarity(0.01)).toBe('legendary');
    expect(rollRarity(0.1)).toBe('rare');
    expect(rollRarity(0.5)).toBe('common');
  });

  it('counts duplicate copies', () => {
    const m = ownedCounts([reward('s01'), reward('s01'), reward('s01'), reward('r02')]);
    expect(m.get('s01')).toBe(3);
    expect(m.get('r02')).toBe(1);
  });
});
