import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../app-context';
import * as repo from '../db/repo';
import { AgeBand, Child } from '../engine/types';
import { parentStats, ParentStats } from '../engine/stats';
import { hashPin, loadChildState, ChildState, totalStars } from '../game/play';
import { Dragon, dragonById } from '../ui/art';
import { Modal, PinPad, TopBar } from '../ui/common';
import { STATUS_UI } from './TableMap';
import { STATUSES } from '../engine/mastery';

export default function Parent() {
  const { go, st, selectChild } = useApp();
  const [unlocked, setUnlocked] = useState(false);
  const [err, setErr] = useState('');
  const [kids, setKids] = useState<Child[]>([]);
  const [sel, setSel] = useState<string | null>(st?.child.id ?? null);
  const [data, setData] = useState<{ cs: ChildState; stats: ParentStats } | null>(null);
  const [modal, setModal] = useState<null | 'delete' | 'wipe' | 'pin' | 'imported' | 'badfile'>(null);

  const back = () => go(st ? { name: st.child.settings.diagnosticDone ? 'home' : 'diagnostic' } : { name: 'profiles' });

  const check = useCallback(async (pin: string) => {
    const p = await repo.getParent();
    if (p && p.auth_id === (await hashPin(pin))) setUnlocked(true);
    else setErr('קוד שגוי, נסו שוב');
  }, []);

  const refresh = useCallback(async () => {
    const list = await repo.listChildren();
    setKids(list);
    const id = sel && list.some((k) => k.id === sel) ? sel : list[0]?.id ?? null;
    setSel(id);
    if (!id) return setData(null);
    const cs = (await loadChildState(id))!;
    setData({ cs, stats: parentStats([...cs.cfs.values()], cs.attempts, cs.sessions, cs.child.settings.diagnosticBaseline, new Date()) });
  }, [sel]);

  useEffect(() => {
    if (unlocked) refresh();
  }, [unlocked, refresh]);

  if (!unlocked)
    return (
      <section className="screen">
        <TopBar title="אזור הורים" onBack={back} />
        <div className="card"><PinPad title="קוד הורים" onDone={check} error={err} /></div>
      </section>
    );

  const child = data?.cs.child;
  const updateChild = async (patch: Partial<Child>) => {
    if (!child) return;
    await repo.saveChild({ ...child, ...patch, settings: { ...child.settings, ...(patch.settings ?? {}) } });
    await refresh();
    if (st?.child.id === child.id) await selectChild(child.id);
  };

  const download = async () => {
    const blob = new Blob([JSON.stringify(await repo.exportAll())], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kefel-ksamim-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const upload = async (file: File | undefined) => {
    if (!file) return;
    try {
      await repo.importAll(JSON.parse(await file.text()));
      await selectChild(null);
      await refresh();
      setModal('imported');
    } catch {
      setModal('badfile');
    }
  };

  const counts = STATUSES.map((s) => [s, [...(data?.cs.cfs.values() ?? [])].filter((c) => c.status === s).length] as const);
  const unseen = 55 - counts.slice(1).reduce((t, [, n]) => t + n, 0);

  return (
    <section className="screen parent">
      <TopBar title="אזור הורים" onBack={back} />
      <div className="kid-tabs" role="tablist">
        {kids.map((k) => (
          <button key={k.id} role="tab" aria-selected={sel === k.id} className={`kid-tab ${sel === k.id ? 'on' : ''}`} onClick={() => setSel(k.id)}>
            <Dragon def={dragonById(k.avatar_id)} size={36} /> {k.nickname}
          </button>
        ))}
        <button className="kid-tab add" onClick={() => go({ name: 'addChild' })}>＋ ילד/ה</button>
      </div>

      {data && child && (
        <>
          <div className="card">
            <h2>למידה (לפי שליפה אמיתית)</h2>
            {!child.settings.diagnosticDone && <p className="muted">משחק הפתיחה עוד לא הושלם.</p>}
            <div className="kpi-grid">
              <Kpi n={data.stats.independent} label="עובדות שנשלפו לבד (הוקלדו נכון בלי רמז)" />
              <Kpi n={data.stats.delayedSuccess} label="עובדות שהצליחו גם בחזרה מאוחרת" strong />
              <Kpi n={data.stats.pendingReviews} label="חזרות שממתינות עכשיו" />
              <Kpi n={data.stats.trainingDays} label="ימי אימון" />
              <Kpi n={(data.stats.changeSinceDiagnostic >= 0 ? '+' : '') + data.stats.changeSinceDiagnostic} label="שינוי מאז משחק הפתיחה (עובדות שזוכרים)" />
            </div>
            <h3>מצב 55 העובדות</h3>
            <ul className="status-bars">
              <li><span className="map-cell mini s-unseen" />{STATUS_UI.unseen.label}: <b>{unseen}</b></li>
              {counts.slice(1).map(([s, n]) => (
                <li key={s}><span className={`map-cell mini ${STATUS_UI[s].cls}`}>{STATUS_UI[s].mark}</span>{STATUS_UI[s].label}: <b>{n}</b></li>
              ))}
            </ul>
            <p className="muted small">“עוד לא בדקנו” לא אומר שהילד לא יודע, רק שעוד לא נבדק. שליטה נקבעת רק אחרי הצלחות חוזרות לאורך ימים.</p>
            <h3>טעויות חוזרות</h3>
            {data.stats.repeatedErrors.length ? (
              <ul className="chips">
                {data.stats.repeatedErrors.slice(0, 10).map((e) => <li key={e.key} className="chip ltr">{e.key.replace('x', ' × ')} <small>({e.count})</small></li>)}
              </ul>
            ) : <p className="muted">אין כרגע.</p>}
          </div>

          <div className="card game-card">
            <h2>משחק (לא מעיד על ידע)</h2>
            <div className="kpi-grid">
              <Kpi n={totalStars(data.cs)} label="כוכבים" />
              <Kpi n={data.cs.rewards.length} label="מפלצות באוסף" />
            </div>
          </div>

          <div className="card">
            <h2>הגדרות של {child.nickname}</h2>
            <label className="field">
              <span>כינוי</span>
              <input defaultValue={child.nickname} maxLength={16} onBlur={(e) => e.target.value.trim() && updateChild({ nickname: e.target.value.trim() })} />
            </label>
            <div className="field">
              <span>גיל</span>
              <div className="seg">
                {(['5-7', '8-10', '11+'] as AgeBand[]).map((b) => (
                  <button key={b} className={`seg-btn ${child.age_band === b ? 'on' : ''}`} aria-pressed={child.age_band === b} onClick={() => updateChild({ age_band: b })}>
                    {child.age_band === b ? '✓ ' : ''}{b}
                  </button>
                ))}
              </div>
            </div>
            <label className="check">
              <input type="checkbox" checked={child.settings.readAloud} onChange={(e) => updateChild({ settings: { ...child.settings, readAloud: e.target.checked } })} />
              <span>כפתור הקראה בקול</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={child.settings.reduceMotion} onChange={(e) => updateChild({ settings: { ...child.settings, reduceMotion: e.target.checked } })} />
              <span>פחות אנימציות</span>
            </label>
            <button className="btn" onClick={() => go({ name: 'dragon', childId: child.id, fromParent: true })}>החלפת דרקון</button>
            <button className="btn btn-danger" onClick={() => setModal('delete')}>מחיקת {child.nickname} וכל הנתונים שלו/ה</button>
          </div>
        </>
      )}

      <div className="card">
        <h2>גיבוי ופרטיות</h2>
        <p className="muted small">כל המידע שמור רק בטלפון הזה. כדאי להוריד גיבוי מדי פעם.</p>
        <button className="btn" onClick={download}>הורדת קובץ גיבוי</button>
        <label className="btn file-btn">
          שחזור מגיבוי
          <input type="file" accept="application/json,.json" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
        <button className="btn" onClick={() => setModal('pin')}>שינוי קוד הורים</button>
        <button className="btn btn-danger" onClick={() => setModal('wipe')}>מחיקת כל המידע באפליקציה</button>
      </div>

      {modal === 'delete' && child && (
        <Modal onClose={() => setModal(null)}>
          <h2>למחוק את {child.nickname}?</h2>
          <p>כל ההתקדמות, הכוכבים והמפלצות יימחקו. אי אפשר לבטל.</p>
          <div className="row">
            <button className="btn btn-danger" onClick={async () => {
              await repo.deleteChild(child.id);
              if (st?.child.id === child.id) await selectChild(null);
              setModal(null);
              setSel(null);
              await refresh();
            }}>כן, למחוק</button>
            <button className="btn" onClick={() => setModal(null)}>ביטול</button>
          </div>
        </Modal>
      )}
      {modal === 'wipe' && (
        <Modal onClose={() => setModal(null)}>
          <h2>למחוק הכול?</h2>
          <p>כל הילדים, ההתקדמות וקוד ההורים יימחקו מהטלפון.</p>
          <div className="row">
            <button className="btn btn-danger" onClick={async () => {
              await repo.wipeEverything();
              try { localStorage.clear(); } catch { /* ignore */ }
              location.reload();
            }}>כן, למחוק הכול</button>
            <button className="btn" onClick={() => setModal(null)}>ביטול</button>
          </div>
        </Modal>
      )}
      {modal === 'pin' && (
        <Modal onClose={() => setModal(null)}>
          <PinPad title="קוד הורים חדש" onDone={async (p) => {
            const cur = await repo.getParent();
            if (cur) await repo.saveParent({ ...cur, auth_id: await hashPin(p) });
            setModal(null);
          }} />
        </Modal>
      )}
      {(modal === 'imported' || modal === 'badfile') && (
        <Modal onClose={() => setModal(null)}>
          <h2>{modal === 'imported' ? 'הגיבוי שוחזר ✓' : 'הקובץ לא תקין'}</h2>
          <p>{modal === 'imported' ? 'כל הנתונים מהגיבוי חזרו.' : 'לא שיניתי כלום. צריך לבחור קובץ גיבוי של כפל קסמים.'}</p>
          <button className="btn btn-primary" onClick={() => setModal(null)}>אישור</button>
        </Modal>
      )}
    </section>
  );
}

function Kpi({ n, label, strong }: { n: number | string; label: string; strong?: boolean }) {
  return (
    <div className={`kpi ${strong ? 'strong' : ''}`}>
      <span className="kpi-num">{n}</span>
      <span className="kpi-label">{label}</span>
    </div>
  );
}
