import { useState } from 'react';
import { DayBar } from '../game/practice';

/** Exercises per day, last 7 days. Tap a bar to see its numbers. Single series: no legend. */
export function PracticeChart({ days }: { days: DayBar[] }) {
  const [sel, setSel] = useState(days.length - 1);
  const max = Math.max(5, ...days.map((d) => d.exercises));
  const d = days[sel];
  return (
    <figure className="pchart">
      <figcaption className="muted small">תרגילים בכל יום, 7 הימים האחרונים</figcaption>
      <div className="pchart-plot" dir="ltr" role="list">
        <div className="pchart-grid" aria-hidden="true"><span /><span /></div>
        {days.map((day, i) => (
          <button
            key={day.date}
            role="listitem"
            className={`pchart-col ${i === sel ? 'on' : ''}`}
            onClick={() => setSel(i)}
            aria-label={`${day.label}: ${day.exercises} תרגילים, ${day.minutes} דקות`}
          >
            <span className="pchart-val">{i === sel && day.exercises > 0 ? day.exercises : ''}</span>
            <span className="pchart-bar" style={{ height: `${(day.exercises / max) * 100}%` }} />
            <span className="pchart-label">{day.label}</span>
          </button>
        ))}
      </div>
      <p className="pchart-detail" role="status">
        <b>{d.label === 'היום' ? 'היום' : `יום ${d.label}`}:</b>{' '}
        {d.exercises ? `${d.exercises} תרגילים · ${d.minutes < 1 ? 'פחות מדקה' : d.minutes === 1 ? 'דקה אחת' : `${d.minutes} דקות`}` : 'לא תרגלו'}
      </p>
    </figure>
  );
}
