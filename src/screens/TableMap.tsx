import { useState } from 'react';
import { useApp } from '../app-context';
import { canonicalKey } from '../engine/facts';
import { Status } from '../engine/mastery';
import { TopBar } from '../ui/common';

export const STATUS_UI: Record<Status, { label: string; mark: string; cls: string }> = {
  unseen: { label: 'עוד לא בדקנו', mark: '', cls: 's-unseen' },
  learning: { label: 'לומדים', mark: '•', cls: 's-learning' },
  recall_1: { label: 'זוכרים קצת', mark: '◔', cls: 's-recall' },
  recall_2: { label: 'זוכרים', mark: '◑', cls: 's-recall2' },
  consolidating: { label: 'כמעט אלופים', mark: '◕', cls: 's-cons' },
  mastered: { label: 'אלופים', mark: '★', cls: 's-mastered' },
};

const N = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function TableMap() {
  const { st, go } = useApp();
  const [table, setTable] = useState<number | null>(null);
  const status = (a: number, b: number): Status => st!.cfs.get(canonicalKey(a, b))?.status ?? 'unseen';

  return (
    <section className="screen">
      <TopBar title="מפת הכפולות" onBack={() => go({ name: 'home' })} />
      <p className="muted center-text">לוחצים על מספר כדי לתרגל את הכפולה שלו</p>
      <div className="map-wrap" dir="ltr">
        <div className="map">
          <div className="map-corner">×</div>
          {N.map((b) => <div key={`h${b}`} className="map-head">{b}</div>)}
          {N.map((a) => (
            <div key={`r${a}`} className="map-row">
              <button className={`map-head map-row-btn ${table === a ? 'on' : ''}`} onClick={() => setTable(a)} aria-label={`כפולת ${a}`}>{a}</button>
              {N.map((b) => {
                const s = STATUS_UI[status(a, b)];
                return (
                  <div key={b} className={`map-cell ${s.cls} ${table === a || table === b ? 'hl' : ''}`} title={`${a}×${b}: ${s.label}`} aria-label={`${a} כפול ${b}: ${s.label}`}>
                    {s.mark}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <ul className="legend">
        {Object.values(STATUS_UI).map((s) => (
          <li key={s.cls}><span className={`map-cell mini ${s.cls}`}>{s.mark}</span>{s.label}</li>
        ))}
      </ul>
      {table && (
        <div className="sticky-cta">
          <button className="btn btn-primary btn-xl" onClick={() => go({ name: 'play', type: 'typed_game', table })}>מתרגלים את כפולת {table}</button>
        </div>
      )}
    </section>
  );
}
