import { useState } from 'react';
import { useApp } from '../app-context';
import * as repo from '../db/repo';
import { AgeBand, uid } from '../engine/types';

const BANDS: { id: AgeBand; label: string }[] = [
  { id: '5-7', label: 'גילאי 5–7' },
  { id: '8-10', label: 'גילאי 8–10' },
  { id: '11+', label: '11 ומעלה' },
];

export default function AddChild() {
  const { go } = useApp();
  const [nick, setNick] = useState('');
  const [band, setBand] = useState<AgeBand | null>(null);
  const clean = nick.trim().slice(0, 16);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!clean || !band || saving) return;
    setSaving(true);
    const id = uid();
    await repo.saveChild({
      id, parent_id: 'parent', nickname: clean, age_band: band, avatar_id: 'ember', created_at: Date.now(),
      settings: { reduceMotion: false, readAloud: true, diagnosticDone: false, diagnosticBaseline: 0 },
    });
    go({ name: 'dragon', childId: id });
  };

  return (
    <section className="screen">
      <div className="card">
        <h2>פרופיל חדש</h2>
        <label className="field">
          <span>כינוי במשחק</span>
          <input value={nick} maxLength={16} onChange={(e) => setNick(e.target.value)} placeholder="למשל: דרקון־על" autoComplete="off" />
          <small className="muted">רק כינוי, לא שם מלא.</small>
        </label>
        <div className="field">
          <span>גיל</span>
          <div className="seg">
            {BANDS.map((b) => (
              <button key={b.id} className={`seg-btn ${band === b.id ? 'on' : ''}`} aria-pressed={band === b.id} onClick={() => setBand(b.id)}>
                {band === b.id && <span aria-hidden="true">✓ </span>}{b.label}
              </button>
            ))}
          </div>
          <small className="muted">הגיל משנה רק את גודל הכתב והממשק. מסלול הלמידה נקבע לפי ההצלחות.</small>
        </div>
        <button className="btn btn-primary btn-xl" disabled={!clean || !band || saving} onClick={save}>להמשיך לבחירת דרקון</button>
      </div>
    </section>
  );
}
