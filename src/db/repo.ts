import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { ChildFact, STATUSES } from '../engine/mastery';
import { CANONICAL_KEYS, FACTS } from '../engine/facts';
import { Attempt, Child, Parent, Reward, Session } from '../engine/types';

interface KefelDB extends DBSchema {
  meta: { key: string; value: Parent };
  children: { key: string; value: Child };
  childFacts: { key: [string, string]; value: ChildFact; indexes: { by_child: string } };
  attempts: { key: string; value: Attempt; indexes: { by_child: string } };
  sessions: { key: string; value: Session; indexes: { by_child: string } };
  rewards: { key: string; value: Reward; indexes: { by_child: string } };
}

export const DB_NAME = 'kefel-ksamim';
export const EXPORT_VERSION = 1;
let dbp: Promise<IDBPDatabase<KefelDB>> | null = null;

export function db(): Promise<IDBPDatabase<KefelDB>> {
  if (!dbp) {
    dbp = openDB<KefelDB>(DB_NAME, 1, {
      upgrade(d) {
        d.createObjectStore('meta', { keyPath: 'id' });
        d.createObjectStore('children', { keyPath: 'id' });
        d.createObjectStore('childFacts', { keyPath: ['child_id', 'canonical_key'] }).createIndex('by_child', 'child_id');
        d.createObjectStore('attempts', { keyPath: 'id' }).createIndex('by_child', 'child_id');
        d.createObjectStore('sessions', { keyPath: 'id' }).createIndex('by_child', 'child_id');
        d.createObjectStore('rewards', { keyPath: 'id' }).createIndex('by_child', 'child_id');
      },
    });
  }
  return dbp;
}

/** For tests: forget the cached connection. */
export async function closeDb() {
  if (dbp) (await dbp).close();
  dbp = null;
}

export async function getParent(): Promise<Parent | undefined> {
  return (await db()).get('meta', 'parent');
}
export async function saveParent(p: Parent) {
  await (await db()).put('meta', p);
}

export async function listChildren(): Promise<Child[]> {
  return (await (await db()).getAll('children')).sort((a, b) => a.created_at - b.created_at);
}
export async function getChild(id: string) {
  return (await db()).get('children', id);
}
export async function saveChild(c: Child) {
  await (await db()).put('children', c);
}

const CHILD_STORES = ['childFacts', 'attempts', 'sessions', 'rewards'] as const;

export async function deleteChild(id: string) {
  const d = await db();
  const tx = d.transaction(['children', ...CHILD_STORES], 'readwrite');
  await tx.objectStore('children').delete(id);
  for (const s of CHILD_STORES) {
    const store = tx.objectStore(s);
    let cur = await store.index('by_child').openCursor(IDBKeyRange.only(id));
    while (cur) {
      await cur.delete();
      cur = await cur.continue();
    }
  }
  await tx.done;
}

export async function getChildFacts(childId: string): Promise<Map<string, ChildFact>> {
  const rows = await (await db()).getAllFromIndex('childFacts', 'by_child', childId);
  return new Map(rows.map((r) => [r.canonical_key, r]));
}

export async function getAttempts(childId: string): Promise<Attempt[]> {
  return (await (await db()).getAllFromIndex('attempts', 'by_child', childId)).sort((a, b) => a.timestamp - b.timestamp);
}
export async function getSessions(childId: string): Promise<Session[]> {
  return (await db()).getAllFromIndex('sessions', 'by_child', childId);
}
export async function getRewards(childId: string): Promise<Reward[]> {
  return (await db()).getAllFromIndex('rewards', 'by_child', childId);
}

/**
 * Atomically store an attempt together with the updated ChildFact and session counters.
 * Idempotent: an attempt id already stored is ignored (returns false).
 */
export async function recordAttempt(attempt: Attempt, cf: ChildFact, session?: Session): Promise<boolean> {
  if (cf.child_id !== attempt.child_id) throw new Error('child mismatch');
  const d = await db();
  const tx = d.transaction(['attempts', 'childFacts', 'sessions'], 'readwrite');
  const exists = await tx.objectStore('attempts').get(attempt.id);
  if (exists) {
    await tx.done;
    return false;
  }
  await tx.objectStore('attempts').put(attempt);
  await tx.objectStore('childFacts').put(cf);
  if (session) await tx.objectStore('sessions').put(session);
  await tx.done;
  return true;
}

export async function saveSession(s: Session) {
  await (await db()).put('sessions', s);
}
export async function addReward(r: Reward) {
  await (await db()).put('rewards', r);
}

export type ExportFile = {
  app: 'kefel-ksamim';
  version: number;
  exported_at: number;
  parent: Parent | null;
  children: Child[];
  childFacts: ChildFact[];
  attempts: Attempt[];
  sessions: Session[];
  rewards: Reward[];
};

export async function exportAll(): Promise<ExportFile> {
  const d = await db();
  return {
    app: 'kefel-ksamim',
    version: EXPORT_VERSION,
    exported_at: Date.now(),
    parent: (await d.get('meta', 'parent')) ?? null,
    children: await d.getAll('children'),
    childFacts: await d.getAll('childFacts'),
    attempts: await d.getAll('attempts'),
    sessions: await d.getAll('sessions'),
    rewards: await d.getAll('rewards'),
  };
}

/** Replace all data with a backup file. Throws (and changes nothing) if the file is invalid. */
export async function importAll(raw: unknown): Promise<void> {
  const f = raw as ExportFile;
  if (!f || f.app !== 'kefel-ksamim' || typeof f.version !== 'number' || f.version > EXPORT_VERSION) {
    throw new Error('invalid backup');
  }
  for (const k of ['children', 'childFacts', 'attempts', 'sessions', 'rewards'] as const) {
    if (!Array.isArray(f[k])) throw new Error('invalid backup');
  }
  validateBackup(f);
  const d = await db();
  const tx = d.transaction(['meta', 'children', ...CHILD_STORES], 'readwrite');
  await Promise.all(['meta', 'children', ...CHILD_STORES].map((s) => tx.objectStore(s as 'meta').clear()));
  if (f.parent) await tx.objectStore('meta').put(f.parent);
  for (const c of f.children) await tx.objectStore('children').put(c);
  for (const c of f.childFacts) await tx.objectStore('childFacts').put(c);
  for (const c of f.attempts) await tx.objectStore('attempts').put(c);
  for (const c of f.sessions) await tx.objectStore('sessions').put(c);
  for (const c of f.rewards) await tx.objectStore('rewards').put(c);
  await tx.done;
}

const FACT_IDS = new Set(FACTS.map((x) => x.id));
const KEYS = new Set(CANONICAL_KEYS);
const STATUS_SET = new Set<string>(STATUSES);

/** Reject a backup whose records would crash the app (e.g. a hand-edited file). */
function validateBackup(f: ExportFile) {
  const bad = () => {
    throw new Error('invalid backup');
  };
  const kids = new Set<string>();
  for (const c of f.children) {
    if (!c || typeof c.id !== 'string' || typeof c.nickname !== 'string' || !c.settings) bad();
    kids.add(c.id);
  }
  for (const c of f.childFacts) if (!kids.has(c.child_id) || !KEYS.has(c.canonical_key) || !STATUS_SET.has(c.status)) bad();
  for (const a of f.attempts) if (!kids.has(a.child_id) || !FACT_IDS.has(a.fact_id) || typeof a.id !== 'string') bad();
  for (const s of f.sessions) if (!kids.has(s.child_id) || typeof s.id !== 'string') bad();
  for (const r of f.rewards) if (!kids.has(r.child_id) || typeof r.id !== 'string') bad();
}

export async function wipeEverything() {
  await closeDb();
  await new Promise<void>((res, rej) => {
    const r = indexedDB.deleteDatabase(DB_NAME);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
    r.onblocked = () => res();
  });
}
