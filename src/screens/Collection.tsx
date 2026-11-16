import { useState } from 'react';
import { useApp } from '../app-context';
import { bagsAvailable, CardDef, CARDS, ownedCounts, RARITY_NAME, SHINY_AT, STARS_PER_BAG } from '../game/cards';
import { totalStars, trainingDays } from '../game/play';
import { Dragon, dragonById, dragonStage, STAGE_NAMES, Star } from '../ui/art';
import { Modal, TopBar } from '../ui/common';
import { SquishyCard } from '../ui/Squishy';

export default function Collection() {
  const { st, go } = useApp();
  const s = st!;
  const [open, setOpen] = useState<CardDef | null>(null);
  const owned = ownedCounts(s.rewards);
  const stars = totalStars(s);
  const bags = bagsAvailable(stars, s.sessions, s.rewards);
  const days = trainingDays(s);
  const stage = dragonStage(days);
  const nextStageAt = stage === 0 ? 3 : stage === 1 ? 7 : null;
  const toNext = STARS_PER_BAG - (stars % STARS_PER_BAG);
  const dragon = dragonById(s.child.avatar_id);
  const shinies = [...owned.values()].filter((n) => n >= SHINY_AT).length;

  return (
    <section className="screen">
      <TopBar title="האוסף שלי" onBack={() => go({ name: 'home' })} right={<span className="star-pill"><Star /> {stars}</span>} />

      <button className={`bag-banner ${bags ? 'has' : ''}`} onClick={() => go({ name: 'bag' })}>
        <span className="bag-emoji" aria-hidden="true">🎁</span>
        <span>
          {bags ? <b>{bags === 1 ? 'יש לך שקית הפתעה!' : `יש לך ${bags} שקיות הפתעה!`}</b> : <b>השקית הבאה</b>}
          <small>{bags ? 'לוחצים כדי לפתוח' : toNext === 1 ? 'עוד כוכב אחד' : `עוד ${toNext} כוכבים`}</small>
        </span>
      </button>

      <div className="album-head">
        <h2 className="section-title">אלבום הסקווישים</h2>
        <span className="album-count">{owned.size}/{CARDS.length}{shinies ? ` · ✨${shinies}` : ''}</span>
      </div>
      <div className="album-bar" aria-hidden="true"><span style={{ width: `${(owned.size / CARDS.length) * 100}%` }} /></div>
      <div className="album-grid">
        {CARDS.map((c) => {
          const n = owned.get(c.id) ?? 0;
          return <SquishyCard key={c.id} def={c} count={n} onClick={n ? () => setOpen(c) : undefined} />;
        })}
      </div>

      <div className="card collection-dragon">
        <Dragon def={dragon} size={120} stage={stage} />
        <div>
          <h2>{dragon.name}: {STAGE_NAMES[stage]}</h2>
          <p className="muted">
            {nextStageAt ? (nextStageAt - days === 1 ? 'עוד יום אימון אחד והוא יגדל!' : `עוד ${nextStageAt - days} ימי אימון והוא יגדל!`) : 'הדרקון הגיע לשיא הכוח!'}
          </p>
        </div>
      </div>

      {open && (
        <Modal onClose={() => setOpen(null)}>
          <div className="card-detail">
            <SquishyCard def={open} count={owned.get(open.id) ?? 1} size="lg" onClick={() => undefined} />
            <p className="center-text">
              {RARITY_NAME[open.rarity]} · {(owned.get(open.id) ?? 0) >= SHINY_AT
                ? 'מבריק ✨'
                : (SHINY_AT - (owned.get(open.id) ?? 0) === 1 ? 'עוד עותק אחד והוא יהיה מבריק' : `עוד ${SHINY_AT - (owned.get(open.id) ?? 0)} עותקים והוא יהיה מבריק`)}
            </p>
            <button className="btn btn-primary" onClick={() => setOpen(null)}>סגירה</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
