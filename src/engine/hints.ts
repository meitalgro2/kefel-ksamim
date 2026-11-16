export type Strategy =
  | 'identity'
  | 'tens'
  | 'double'
  | 'half_ten'
  | 'ten_minus'
  | 'double_double'
  | 'split'
  | 'groups';

export type Hint = {
  strategy: Strategy;
  title: string;
  steps: string[];
  /** Optional dot picture: `rows` groups of `per` dots. */
  dots?: { rows: number; per: number };
};

const TITLES: Record<Strategy, string> = {
  identity: 'כפול 1',
  tens: 'כפול 10',
  double: 'כפול 2: פעמיים',
  half_ten: 'כפול 5: חצי מכפול 10',
  ten_minus: 'כפול 9: עשר פחות אחד',
  double_double: 'כפול 4: להכפיל ולהכפיל',
  split: 'מפרקים לחלקים קלים',
  groups: 'סופרים בקבוצות',
};

/** Pick the friendliest strategy for a×b and explain it in Hebrew, step by step. */
export function hintFor(a: number, b: number): Hint {
  const p = a * b;
  // n = the factor we "act on", k = the special factor.
  const pick = (k: number) => (a === k ? b : a);
  const has = (k: number) => a === k || b === k;
  const dots = p <= 30 ? { rows: a, per: b } : undefined;
  const make = (strategy: Strategy, steps: string[]): Hint => ({ strategy, title: TITLES[strategy], steps, dots });

  if (has(1)) {
    const n = pick(1);
    return make('identity', [`כל מספר כפול 1 נשאר אותו מספר.`, `${a} × ${b} = ${p}`]);
  }
  if (has(10)) {
    const n = pick(10);
    return make('tens', [`כפול 10? מוסיפים אפס בסוף המספר.`, `${n} → ${n}0`, `${a} × ${b} = ${p}`]);
  }
  if (has(2)) {
    const n = pick(2);
    return make('double', [`כפול 2 זה אותו מספר פעמיים.`, `${n} + ${n} = ${p}`]);
  }
  if (has(5)) {
    const n = pick(5);
    return make('half_ten', [`קודם כפול 10: ${n} × 10 = ${n * 10}`, `עכשיו חצי מזה: ${n * 10} ÷ 2 = ${p}`]);
  }
  if (has(9)) {
    const n = pick(9);
    return make('ten_minus', [`קודם כפול 10: ${n} × 10 = ${n * 10}`, `מורידים ${n}: ${n * 10} − ${n} = ${p}`]);
  }
  if (has(4)) {
    const n = pick(4);
    return make('double_double', [`מכפילים פעם אחת: ${n} + ${n} = ${n * 2}`, `ושוב: ${n * 2} + ${n * 2} = ${p}`]);
  }
  if (p <= 12) {
    // e.g. 3×3: count in groups
    const sums: number[] = [];
    for (let i = 1; i <= a; i++) sums.push(i * b);
    return make('groups', [`${a} קבוצות של ${b}.`, `סופרים: ${sums.join(', ')}`, `${a} × ${b} = ${p}`]);
  }
  // split the bigger factor into 5 + rest
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  const rest = big - 5;
  return make('split', [
    `מפרקים את ${big} ל-5 ועוד ${rest}.`,
    `${small} × 5 = ${small * 5}`,
    `${small} × ${rest} = ${small * rest}`,
    `ביחד: ${small * 5} + ${small * rest} = ${p}`,
  ]);
}
