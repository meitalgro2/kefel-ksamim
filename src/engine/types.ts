export type AgeBand = '5-7' | '8-10' | '11+';

export type ChildSettings = {
  reduceMotion: boolean;
  readAloud: boolean;
  diagnosticDone: boolean;
  diagnosticBaseline: number; // facts at recall_1+ right after diagnostic
};

export type Parent = {
  id: 'parent';
  auth_id: string; // local PIN hash
  consent_version: string;
  created_at: number;
};

export type Child = {
  id: string;
  parent_id: 'parent';
  nickname: string;
  age_band: AgeBand;
  avatar_id: string; // dragon id
  settings: ChildSettings;
  created_at: number;
};

export type Attempt = {
  id: string;
  child_id: string;
  fact_id: string;
  session_id: string;
  timestamp: number;
  mode: 'choice' | 'typed';
  response: number | null;
  correct: boolean;
  hint_used: boolean;
  response_ms: number;
  scheduled_review: boolean; // fact was due for a spaced review (recall_1+) when asked
  due_at_at_attempt: number | null;
};

export type SessionType = 'diagnostic' | 'daily' | 'choice_game' | 'typed_game';

export type Session = {
  id: string;
  child_id: string;
  started_at: number;
  finished_at: number | null;
  type: SessionType;
  items_seen: number;
  independent_correct: number;
  stars_earned: number;
};

export type Reward = {
  id: string;
  child_id: string;
  reward_type: string; // monster id
  earned_at: number;
  source_session_id: string;
};

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
