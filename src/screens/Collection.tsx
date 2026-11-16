import { useApp } from '../app-context';
import { STARS_PER_MONSTER, totalStars, trainingDays } from '../game/play';
import { Dragon, dragonById, dragonStage, Monster, MONSTERS, STAGE_NAMES, Star } from '../ui/art';
import { TopBar } from '../ui/common';

export default function Collection() {
  const { st, go } = useApp();
  const s = st!;
  const have = new Set(s.rewards.map((r) => r.reward_type));
  const stars = totalStars(s);
  const days = trainingDays(s);
  const stage = dragonStage(days);
  const nextStageAt = stage === 0 ? 3 : stage === 1 ? 7 : null;
  const toNext = STARS_PER_MONSTER - (stars % STARS_PER_MONSTER);
  const dragon = dragonById(s.child.avatar_id);

  return (
    <section className="screen">
      <TopBar title="האוסף שלי" onBack={() => go({ name: 'home' })} right={<span className="star-pill"><Star /> {stars}</span>} />
      <div className="card collection-dragon">
        <Dragon def={dragon} size={150} stage={stage} />
        <div>
          <h2>{dragon.name}: {STAGE_NAMES[stage]}</h2>
          <p className="muted">
            {nextStageAt ? (nextStageAt - days === 1 ? "עוד יום אימון אחד והוא יגדל!" : `עוד ${nextStageAt - days} ימי אימון והוא יגדל!`) : 'הדרקון הגיע לשיא הכוח!'}
          </p>
        </div>
      </div>
      <h2 className="section-title">מפלצות ({have.size}/{MONSTERS.length})</h2>
      {have.size < MONSTERS.length && <p className="muted">{toNext === 1 ? "עוד כוכב אחד למפלצת הבאה" : `עוד ${toNext} כוכבים למפלצת הבאה`}</p>}
      <div className="monster-grid">
        {MONSTERS.map((m) => {
          const got = have.has(m.id);
          return (
            <div key={m.id} className={`monster-card ${got ? '' : 'locked'}`}>
              <Monster def={m} locked={!got} size={84} />
              <span>{got ? m.name : '???'}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
