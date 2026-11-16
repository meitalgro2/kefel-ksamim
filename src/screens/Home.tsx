import { useEffect, useState } from 'react';
import { useApp } from '../app-context';
import { dueCount, totalStars, trainingDays, syncRewards } from '../game/play';
import { Dragon, dragonById, dragonStage, MONSTERS, STAGE_NAMES, Star } from '../ui/art';
import { TopBar } from '../ui/common';

export default function Home() {
  const { st, go, reload } = useApp();
  const s = st!;
  const [, force] = useState(0);
  useEffect(() => {
    // unlock anything earned in a session that was closed abruptly
    syncRewards(s, MONSTERS.map((m) => m.id), 'sync').then((fresh) => fresh.length && force((x) => x + 1));
  }, [s]);
  useEffect(() => {
    // returning to the app on another day: refresh due counts
    const h = () => document.visibilityState === 'visible' && reload();
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [reload]);

  const now = new Date();
  const due = dueCount(s, now);
  const days = trainingDays(s);
  const stage = dragonStage(days);
  const dragon = dragonById(s.child.avatar_id);
  const stars = totalStars(s);
  const trainedToday = s.sessions.some((x) => x.type === 'daily' && x.finished_at && new Date(x.finished_at).toDateString() === now.toDateString());

  const message = trainedToday
    ? 'כל הכבוד על האימון של היום! אפשר לשחק עוד, או לחזור מחר.'
    : due > 0
      ? `יש ${due} תרגילים שמחכים לחזרה. יחד נזכור אותם!`
      : 'מוכנים לאימון? בואו נתרגל יחד!';

  return (
    <section className="screen home">
      <TopBar
        right={
          <>
            <span className="star-pill" aria-label={`${stars} כוכבים`}><Star /> {stars}</span>
            <button className="icon-btn" aria-label="הורים" onClick={() => go({ name: 'parent' })}>
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-2.6.1-.9-.1-.9 2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.5-.9L15 3.6h-4l-.5 2.6a7 7 0 0 0-1.5.9l-2.4-1-2 3.4 2 1.6-.1.9.1.9-2 1.6 2 3.4 2.4-1c.5.4 1 .7 1.5.9l.5 2.6h4l.5-2.6c.5-.2 1-.5 1.5-.9l2.4 1 2-3.4-2-1.6Z" fill="currentColor" /></svg>
              <span>הורים</span>
            </button>
          </>
        }
        onBack={undefined}
      />
      <div className="home-hero">
        <div className="bubble bubble-top"><p>{message}</p></div>
        <Dragon def={dragon} size={200} stage={stage} mood={trainedToday ? 'calm' : 'happy'} />
        <p className="dragon-caption"><b>{dragon.name}</b> · {STAGE_NAMES[stage]} · {s.child.nickname}</p>
      </div>
      <button className="btn btn-primary btn-xl btn-daily" onClick={() => go({ name: 'play', type: 'daily' })}>
        <span className="btn-big-label">אימון יומי</span>
        <span className="btn-sub">{due > 0 ? `${due} חזרות + תרגילים חדשים` : 'כ-5 דקות'}</span>
      </button>
      <div className="tile-grid">
        <button className="tile tile-mint" onClick={() => go({ name: 'map' })}><span className="tile-icon" aria-hidden="true">▦</span>מפת הכפולות</button>
        <button className="tile tile-sky" onClick={() => go({ name: 'play', type: 'choice_game' })}><span className="tile-icon" aria-hidden="true">◉</span>משחק בחירה</button>
        <button className="tile tile-sun" onClick={() => go({ name: 'play', type: 'typed_game' })}><span className="tile-icon" aria-hidden="true">⌨</span>משחק הקלדה</button>
        <button className="tile tile-berry" onClick={() => go({ name: 'collection' })}><span className="tile-icon" aria-hidden="true">★</span>האוסף שלי</button>
      </div>
      <button className="btn btn-ghost" onClick={() => go({ name: 'profiles' })}>החלפת שחקן</button>
    </section>
  );
}
