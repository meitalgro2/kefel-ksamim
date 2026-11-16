// Squishy card collection: earned with game stars (never with mastery), opened from surprise bags.
import { dateKey } from '../engine/time';
import { Reward, Session } from '../engine/types';

export type Rarity = 'common' | 'rare' | 'legendary';
export type Shape = 'mochi' | 'cat' | 'bunny' | 'bear' | 'ghost' | 'star' | 'cloud' | 'donut' | 'frog' | 'octo';
export type Extra = 'none' | 'bow' | 'leaf' | 'crown' | 'horns' | 'horn' | 'stars' | 'moon' | 'drops' | 'patches' | 'sprinkles';

export type CardDef = { id: string; name: string; rarity: Rarity; shape: Shape; color: string; color2?: string; extra: Extra };

const c = (id: string, name: string, rarity: Rarity, shape: Shape, color: string, extra: Extra = 'none', color2?: string): CardDef => ({
  id, name, rarity, shape, color, extra, color2,
});

export const CARDS: CardDef[] = [
  // common (18)
  c('s01', 'מוצ׳י תות', 'common', 'mochi', '#FFB3C7', 'leaf'),
  c('s02', 'מוצ׳י מנטה', 'common', 'mochi', '#A8EBD0'),
  c('s03', 'פוקי החתול', 'common', 'cat', '#FFD9A8'),
  c('s04', 'מיצי', 'common', 'cat', '#C9C3F5', 'bow'),
  c('s05', 'ארנבון ענן', 'common', 'bunny', '#F4F1EA'),
  c('s06', 'ארנבונית תות', 'common', 'bunny', '#FFC6D9', 'bow'),
  c('s07', 'דובי דבש', 'common', 'bear', '#F2C38B'),
  c('s08', 'דובון שוקו', 'common', 'bear', '#C49A7C'),
  c('s09', 'בו הרוח', 'common', 'ghost', '#EEF0FF'),
  c('s10', 'רוחית לימון', 'common', 'ghost', '#FFF3A0'),
  c('s11', 'כוכבון', 'common', 'star', '#FFE27A'),
  c('s12', 'ענני', 'common', 'cloud', '#DDEFFF'),
  c('s13', 'דונאט סוכריות', 'common', 'donut', '#FFB6D5', 'sprinkles'),
  c('s14', 'דונאט שוקולד', 'common', 'donut', '#9C6B4E', 'sprinkles'),
  c('s15', 'צפרדעון', 'common', 'frog', '#B8E986'),
  c('s16', 'קוואקי', 'common', 'frog', '#8FDCB4', 'bow'),
  c('s17', 'תמנונית', 'common', 'octo', '#FFB59E'),
  c('s18', 'תמנון סגלגל', 'common', 'octo', '#C7A8F0'),
  // rare (9)
  c('r01', 'מוצ׳י קשת', 'rare', 'mochi', '#FFB3C7', 'stars', '#A8D8FF'),
  c('r02', 'חתול חלל', 'rare', 'cat', '#4A5AA8', 'stars'),
  c('r03', 'ארנב הירח', 'rare', 'bunny', '#E8E4FF', 'moon'),
  c('r04', 'פנדה', 'rare', 'bear', '#FFFFFF', 'patches'),
  c('r05', 'רוח נצנצים', 'rare', 'ghost', '#F9D8FF', 'stars'),
  c('r06', 'כוכבת ים', 'rare', 'star', '#FF9E7A', 'bow'),
  c('r07', 'ענן גשם', 'rare', 'cloud', '#A9C6E8', 'drops'),
  c('r08', 'דונאט המלך', 'rare', 'donut', '#FFE27A', 'crown'),
  c('r09', 'נסיך הצפרדעים', 'rare', 'frog', '#7BD389', 'crown'),
  // legendary (3)
  c('l01', 'דרקון מוצ׳י', 'legendary', 'mochi', '#FFC93C', 'horns', '#FF7A1A'),
  c('l02', 'חד־קרן ענן', 'legendary', 'cloud', '#FFE6F5', 'horn', '#C9F1FF'),
  c('l03', 'חתול הזהב', 'legendary', 'cat', '#FFD54A', 'crown', '#FFF1A8'),
];

export const RARITY_NAME: Record<Rarity, string> = { common: 'רגיל', rare: 'נדיר', legendary: 'אגדי' };
export const STARS_PER_BAG = 10;
export const SHINY_AT = 3;
export const GUARANTEED_NEW = 5;
const CARD_PREFIX = 'card:';

export function cardById(id: string): CardDef | undefined {
  return CARDS.find((x) => x.id === id);
}

export function cardRewards(rewards: Reward[]): Reward[] {
  return rewards.filter((r) => r.reward_type.startsWith(CARD_PREFIX) && cardById(r.reward_type.slice(CARD_PREFIX.length)));
}

export function cardRewardType(id: string) {
  return CARD_PREFIX + id;
}

/** id -> how many copies the child has. */
export function ownedCounts(rewards: Reward[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of cardRewards(rewards)) {
    const id = r.reward_type.slice(CARD_PREFIX.length);
    m.set(id, (m.get(id) ?? 0) + 1);
  }
  return m;
}

/** Days with a finished daily session of at least 5 items — one bonus bag each. */
export function dailyBonusDays(sessions: Session[]): number {
  return new Set(
    sessions.filter((s) => s.type === 'daily' && s.finished_at && s.items_seen >= 5).map((s) => dateKey(new Date(s.finished_at!))),
  ).size;
}

export function bagsEarned(totalStars: number, sessions: Session[]): number {
  return Math.floor(totalStars / STARS_PER_BAG) + dailyBonusDays(sessions);
}

export function bagsAvailable(totalStars: number, sessions: Session[], rewards: Reward[]): number {
  return Math.max(0, bagsEarned(totalStars, sessions) - cardRewards(rewards).length);
}

export function rollRarity(r: number): Rarity {
  if (r < 0.05) return 'legendary';
  if (r < 0.3) return 'rare';
  return 'common';
}

/**
 * Pick the card inside a bag. Rules that keep it fun, not frustrating:
 * - the first 5 bags are always a card the child doesn't have yet;
 * - afterwards, a new card 70% of the time while any are missing in the rolled rarity;
 * - never the same card twice in a row.
 */
export function drawCard(owned: Map<string, number>, openedSoFar: number, lastId: string | null, rand: () => number = Math.random): CardDef {
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const rarity = rollRarity(rand());
  const pool = CARDS.filter((x) => x.rarity === rarity);
  const missingIn = (xs: CardDef[]) => xs.filter((x) => !owned.has(x.id));

  if (openedSoFar < GUARANTEED_NEW) {
    const m = missingIn(pool);
    if (m.length) return pick(m);
    const anyMissing = missingIn(CARDS.filter((x) => x.rarity === 'common')).concat(missingIn(CARDS));
    if (anyMissing.length) return anyMissing[0].rarity === 'common' ? pick(missingIn(CARDS.filter((x) => x.rarity === 'common'))) : pick(anyMissing);
  }
  const m = missingIn(pool);
  if (m.length && rand() < 0.7) return pick(m);
  const choices = pool.filter((x) => x.id !== lastId);
  return pick(choices.length ? choices : pool);
}
