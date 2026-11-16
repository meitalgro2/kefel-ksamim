import { useApp } from '../app-context';
import { Session } from '../engine/types';
import { trainingDays } from '../game/play';
import { Dragon, dragonById, dragonStage, Monster, MONSTERS, Star } from '../ui/art';

export default function Summary({ session, newMonsters }: { session: Session; newMonsters: string[] }) {
  const { st, go } = useApp();
  const s = st!;
  const dragon = dragonById(s.child.avatar_id);
  const short = session.items_seen < 5;
  return (
    <section className="screen center summary">
      <Dragon def={dragon} size={170} stage={dragonStage(trainingDays(s))} mood="wow" />
      <h1 className="page-title">{short ? 'יופי שבאת!' : 'סיימנו! כל הכבוד!'}</h1>
      <div className="summary-stats">
        <div className="stat card"><span className="stat-num"><Star size={28} /> {session.stars_earned}</span><span>כוכבים באימון</span></div>
        <div className="stat card"><span className="stat-num">{session.items_seen}</span><span>תרגילים</span></div>
        <div className="stat card"><span className="stat-num">{session.independent_correct}</span><span>הקלדת נכון לבד</span></div>
      </div>
      {newMonsters.length > 0 && (
        <div className="card new-monster">
          <h2>מפלצת חדשה הצטרפה לאוסף!</h2>
          <div className="monster-row">
            {newMonsters.map((id) => {
              const m = MONSTERS.find((x) => x.id === id)!;
              return (
                <div key={id} className="pop">
                  <Monster def={m} size={110} />
                  <b>{m.name}</b>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <button className="btn btn-primary btn-xl" onClick={() => go({ name: 'home' })}>חזרה הביתה</button>
    </section>
  );
}
