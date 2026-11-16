// "How much did they practice?" — for the parent report. Counts all play (diagnostic, daily, games).
import { addDays, dateKey, startOfDay } from '../engine/time';
import { Attempt } from '../engine/types';

export type DayBar = { date: string; label: string; exercises: number; minutes: number };
export type PracticeSummary = {
  days: DayBar[]; // last 7 days, oldest first
  weekExercises: number;
  weekMinutes: number;
  weekActiveDays: number;
  lastPractice: number | null; // epoch ms
  totalExercises: number;
};

const WEEKDAY = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const MAX_GAP_MS = 2 * 60 * 1000; // a pause longer than 2 minutes isn't counted as practice time
const PER_ANSWER_FLOOR_MS = 5000;

/** Practice time = time between consecutive answers in the same session, ignoring long pauses. */
function minutesFor(attempts: Attempt[]): number {
  const bySession = new Map<string, number[]>();
  for (const a of attempts) {
    const arr = bySession.get(a.session_id) ?? [];
    arr.push(a.timestamp);
    bySession.set(a.session_id, arr);
  }
  let ms = 0;
  for (const ts of bySession.values()) {
    ts.sort((x, y) => x - y);
    ms += PER_ANSWER_FLOOR_MS; // the first answer took some time too
    for (let i = 1; i < ts.length; i++) ms += Math.min(MAX_GAP_MS, ts[i] - ts[i - 1]);
  }
  return Math.round(ms / 60000);
}

export function practiceSummary(attempts: Attempt[], now: Date): PracticeSummary {
  const today = startOfDay(now);
  const days: DayBar[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const key = dateKey(d);
    const list = attempts.filter((a) => dateKey(new Date(a.timestamp)) === key);
    days.push({ date: key, label: i === 0 ? 'היום' : WEEKDAY[d.getDay()], exercises: list.length, minutes: list.length ? minutesFor(list) : 0 });
  }
  return {
    days,
    weekExercises: days.reduce((s, d) => s + d.exercises, 0),
    weekMinutes: days.reduce((s, d) => s + d.minutes, 0),
    weekActiveDays: days.filter((d) => d.exercises > 0).length,
    lastPractice: attempts.length ? Math.max(...attempts.map((a) => a.timestamp)) : null,
    totalExercises: attempts.length,
  };
}

export function lastPracticeText(ts: number | null, now: Date): string {
  if (ts === null) return 'עוד לא תרגלו';
  const diff = Math.round((startOfDay(now).getTime() - startOfDay(new Date(ts)).getTime()) / 86400000);
  if (diff <= 0) return 'היום';
  if (diff === 1) return 'אתמול';
  if (diff === 2) return 'שלשום';
  return `לפני ${diff} ימים`;
}
