import { CANONICAL_KEYS, Fact, factById, factsForKey, tablesOfKey } from './facts';

/** 12 opening items: varied tables and difficulty, all distinct canonical keys. */
export const OPENING: [number, number][] = [
  [2, 7], [5, 6], [10, 3], [3, 4], [4, 6], [9, 2],
  [6, 8], [7, 3], [8, 8], [9, 7], [4, 9], [7, 8],
];

export const OPENING_COUNT = 12;
export const MAX_DIAGNOSTIC = 24;

export type DiagResult = { factId: string; correct: boolean };

export function followUpCount(openingCorrect: number): number {
  if (openingCorrect >= 10) return 4;
  if (openingCorrect >= 6) return 8;
  return 12;
}

export function diagnosticLength(results: DiagResult[]): number {
  if (results.length < OPENING_COUNT) return OPENING_COUNT; // provisional
  const ok = results.slice(0, OPENING_COUNT).filter((r) => r.correct).length;
  return Math.min(MAX_DIAGNOSTIC, OPENING_COUNT + followUpCount(ok));
}

/** Next item to ask, or null when the diagnostic is over (never more than 24). */
export function nextDiagnosticItem(results: DiagResult[], rand: () => number = Math.random): Fact | null {
  if (results.length >= MAX_DIAGNOSTIC) return null;
  if (results.length < OPENING_COUNT) {
    const [a, b] = OPENING[results.length];
    return factById(`${a}x${b}`);
  }
  if (results.length >= diagnosticLength(results)) return null;

  const asked = new Set(results.map((r) => factById(r.factId).canonical_key));
  const errorsByTable = new Map<number, number>();
  const okByTable = new Map<number, number>();
  for (const r of results) {
    for (const t of tablesOfKey(factById(r.factId).canonical_key)) {
      const m = r.correct ? okByTable : errorsByTable;
      m.set(t, (m.get(t) ?? 0) + 1);
    }
  }
  const anyErrors = errorsByTable.size > 0;
  const candidates = CANONICAL_KEYS.filter((k) => !asked.has(k) && !k.startsWith('1x'));
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const k of candidates) {
    const tables = tablesOfKey(k);
    const product = tables.length === 1 ? tables[0] ** 2 : tables[0] * tables[1];
    let score: number;
    if (anyErrors) {
      // probe tables with errors; prefer ones we know less about
      score = tables.reduce((s, t) => s + (errorsByTable.get(t) ?? 0) * 2 - (okByTable.get(t) ?? 0) * 0.5, 0);
    } else {
      // all right so far: look for the ceiling with harder facts
      score = product / 10;
    }
    score += rand() * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  if (!best) return null;
  const options = factsForKey(best);
  return options[Math.floor(rand() * options.length)];
}
