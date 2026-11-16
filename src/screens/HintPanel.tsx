import { Hint } from '../engine/hints';
import { MathText } from '../ui/MathText';

export default function HintPanel({ hint }: { hint: Hint }) {
  const dots = hint.dots;
  return (
    <div className="hint card" role="note">
      <h3>💡 {hint.title}</h3>
      <ol>
        {hint.steps.map((s, i) => (
          <li key={i}><MathText text={s} /></li>
        ))}
      </ol>
      {dots && dots.rows * dots.per <= 30 && (
        <div className="dot-grid" dir="ltr" aria-hidden="true">
          {Array.from({ length: dots.rows }).map((_, r) => (
            <div key={r} className="dot-row">
              {Array.from({ length: dots.per }).map((__, c) => <span key={c} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
