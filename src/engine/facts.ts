export type Fact = {
  id: string;
  a: number;
  b: number;
  answer: number;
  canonical_key: string;
  strategy_ids: string[];
};

export function canonicalKey(a: number, b: number): string {
  return `${Math.min(a, b)}x${Math.max(a, b)}`;
}

function strategiesFor(a: number, b: number): string[] {
  const s: string[] = [];
  const has = (n: number) => a === n || b === n;
  if (has(1)) s.push('identity');
  if (has(10)) s.push('tens');
  if (has(2)) s.push('double');
  if (has(5)) s.push('half_ten');
  if (has(9)) s.push('ten_minus');
  if (has(4)) s.push('double_double');
  if (a === b) s.push('square');
  s.push('split');
  if (a * b <= 20) s.push('groups');
  return s;
}

export const FACTS: Fact[] = [];
for (let a = 1; a <= 10; a++) {
  for (let b = 1; b <= 10; b++) {
    FACTS.push({ id: `${a}x${b}`, a, b, answer: a * b, canonical_key: canonicalKey(a, b), strategy_ids: strategiesFor(a, b) });
  }
}

const byId = new Map(FACTS.map((f) => [f.id, f]));
export function factById(id: string): Fact {
  const f = byId.get(id);
  if (!f) throw new Error(`unknown fact ${id}`);
  return f;
}

export const CANONICAL_KEYS: string[] = [...new Set(FACTS.map((f) => f.canonical_key))];

export function factsForKey(key: string): Fact[] {
  return FACTS.filter((f) => f.canonical_key === key);
}

/** The multiplication table(s) a canonical key belongs to, e.g. "7x8" -> [7, 8]. */
export function tablesOfKey(key: string): number[] {
  const [a, b] = key.split('x').map(Number);
  return a === b ? [a] : [a, b];
}
