import { useApp } from '../app-context';
import { Session } from '../engine/types';
import { bagsAvailable } from '../game/cards';
import { totalStars, trainingDays } from '../game/play';
import { Dragon, dragonById, dragonStage, Star } from '../ui/art';

export default function Summary({ session }: { session: Session }) {
  const { st, go } = useApp();
  const s = st!;
  const dragon = dragonById(s.child.avatar_id);
  const short = session.items_seen < 5;
  const bags = bagsAvailable(totalStars(s), s.sessions, s.rewards);
  return (
    <section className="screen center summary">
      <Dragon def={dragon} size={170} stage={dragonStage(trainingDays(s))} mood="wow" />
      <h1 className="page-title">{short ? 'יופי שבאת!' : 'סיימנו! כל הכבוד!'}</h1>
      <div className="summary-stats">
        <div className="stat card"><span className="stat-num"><Star size={28} /> {session.stars_earned}</span><span>כוכבים באימון</span></div>
        <div className="stat card"><span className="stat-num">{session.items_seen}</span><span>תרגילים</span></div>
        <div className="stat card"><span className="stat-num">{session.independent_correct}</span><span>הקלדת נכון לבד</span></div>
      </div>
      {bags > 0 && (
        <button className="bag-banner has pop" onClick={() => go({ name: 'bag' })}>
          <span className="bag-emoji" aria-hidden="true">🎁</span>
          <span>
            <b>{bags === 1 ? 'מחכה לך שקית הפתעה!' : `מחכות לך ${bags} שקיות הפתעה!`}</b>
            <small>לוחצים כדי לפתוח</small>
          </span>
        </button>
      )}
      <button className={`btn btn-xl ${bags ? '' : 'btn-primary'}`} onClick={() => go({ name: 'home' })}>חזרה הביתה</button>
    </section>
  );
}
