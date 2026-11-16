import { describe, it, expect } from 'vitest';
import { FACTS, CANONICAL_KEYS, canonicalKey, factById, factsForKey } from './facts';

describe('fact bank', () => {
  it('has 100 ordered facts and 55 canonical', () => {
    expect(FACTS.length).toBe(100);
    expect(CANONICAL_KEYS.length).toBe(55);
  });
  it('7x8 and 8x7 share canonical key but are separate facts (acceptance 5)', () => {
    expect(canonicalKey(7, 8)).toBe('7x8');
    expect(canonicalKey(8, 7)).toBe('7x8');
    expect(factById('7x8').id).not.toBe(factById('8x7').id);
    expect(factsForKey('7x8').map((f) => f.id).sort()).toEqual(['7x8', '8x7']);
    expect(factsForKey('6x6').length).toBe(1);
  });
});
