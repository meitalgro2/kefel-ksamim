import { createContext, useContext } from 'react';
import { ChildState } from './game/play';
import { SessionType, Session } from './engine/types';

export type Screen =
  | { name: 'loading' }
  | { name: 'onboarding' }
  | { name: 'profiles' }
  | { name: 'addChild' }
  | { name: 'dragon'; childId: string; fromParent?: boolean }
  | { name: 'diagnostic' }
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'play'; type: Exclude<SessionType, 'diagnostic'>; table?: number }
  | { name: 'summary'; session: Session }
  | { name: 'bag' }
  | { name: 'collection' }
  | { name: 'parent' };

export type AppCtx = {
  go: (s: Screen) => void;
  st: ChildState | null;
  selectChild: (id: string | null) => Promise<void>;
  reload: () => Promise<void>;
};

export const Ctx = createContext<AppCtx>(null as unknown as AppCtx);
export const useApp = () => useContext(Ctx);

const LAST = 'kefel:lastChild';
export function rememberChild(id: string | null) {
  try {
    if (id) localStorage.setItem(LAST, id);
    else localStorage.removeItem(LAST);
  } catch {
    /* ignore */
  }
}
export function lastChild(): string | null {
  try {
    return localStorage.getItem(LAST);
  } catch {
    return null;
  }
}
