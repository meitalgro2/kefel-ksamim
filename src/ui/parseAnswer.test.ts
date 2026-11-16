import { it, expect } from 'vitest';
import { parseAnswer } from './parseAnswer';

it('review focus 4: empty, junk and leading zeros', () => {
  expect(parseAnswer('')).toBeNull();
  expect(parseAnswer('   ')).toBeNull();
  expect(parseAnswer('abc')).toBeNull();
  expect(parseAnswer('5a')).toBe(5);
  expect(parseAnswer('056')).toBe(56);
  expect(parseAnswer('100')).toBe(100);
  expect(parseAnswer('12345')).toBe(123);
});
