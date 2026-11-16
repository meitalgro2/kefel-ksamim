import { useState } from 'react';
import { useApp } from '../app-context';
import * as repo from '../db/repo';
import { uid } from '../engine/types';
import { bagsAvailable, cardRewards, cardRewardType, CardDef, drawCard, ownedCounts, SHINY_AT, CARDS } from '../game/cards';
import { totalStars } from '../game/play';
import { SquishyCard } from '../ui/Squishy';
import { TopBar } from '../ui/common';

export default function OpenBag() {
  const { st, go } = useApp();
  const s = st!;
  const [phase, setPhase] = useState<'bag' | 'tearing' | 'reveal'>('bag');
  const [card, setCard] = useState<CardDef | null>(null);
  const [copies, setCopies] = useState(0);
  const [, force] = useState(0);
  const left = bagsAvailable(totalStars(s), s.sessions, s.rewards);
  const owned = ownedCounts(s.rewards);

  const open = async () => {
    if (phase !== 'bag' || left <= 0) return;
    setPhase('tearing');
    const opened = cardRewards(s.rewards);
    const last = opened.length ? opened[opened.length - 1].reward_type.slice(5) : null;
    const c = drawCard(owned, opened.length, last);
    const r = { id: uid(), child_id: s.child.id, reward_type: cardRewardType(c.id), earned_at: Date.now(), source_session_id: 'bag' };
    await repo.addReward(r); // saved before the reveal, so closing the app can't lose it
    s.rewards.push(r);
    setCard(c);
    setCopies((owned.get(c.id) ?? 0) + 1);
    setTimeout(() => setPhase('reveal'), s.child.settings.reduceMotion ? 50 : 700);
  };

  const again = () => {
    setPhase('bag');
    setCard(null);
    force((x) => x + 1);
  };

  const message = !card
    ? ''
    : copies === 1
      ? card.rarity === 'legendary' ? 'וואו! סקווישי אגדי!!' : card.rarity === 'rare' ? 'יש! סקווישי נדיר!' : 'סקווישי חדש לאוסף!'
      : copies === SHINY_AT
        ? `${card.name} הפך למבריק! ✨`
        : copies < SHINY_AT
          ? `עוד ${card.name}! עוד ${SHINY_AT - copies === 1 ? 'אחד' : SHINY_AT - copies} והוא יהיה מבריק ✨`
          : `עוד ${card.name} מבריק לאוסף!`;

  return (
    <section className="screen bag-screen">
      <TopBar title="שקית הפתעה" onBack={() => go({ name: 'collection' })} />
      {phase !== 'reveal' ? (
        <div className="bag-stage">
          {left > 0 || phase === 'tearing' ? (
            <>
              <button className={`bag ${phase}`} onClick={open} aria-label="לפתוח את השקית">
                <svg viewBox="0 0 160 190" width="200" height="238" aria-hidden="true">
                  <path d="M20 40 L140 40 L150 178 Q80 190 10 178 Z" fill="#FF7A1A" stroke="#2B1B3D" strokeWidth="6" strokeLinejoin="round" />
                  <path d="M20 40 l10 -14 l10 14 l10 -14 l10 14 l10 -14 l10 14 l10 -14 l10 14 l10 -14 l10 14 l10 -14 l10 14" fill="#FFC93C" stroke="#2B1B3D" strokeWidth="6" strokeLinejoin="round" className="bag-top" />
                  <circle cx="80" cy="108" r="34" fill="#FFF6E5" stroke="#2B1B3D" strokeWidth="5" />
                  <text x="80" y="122" textAnchor="middle" fontSize="40" fontWeight="700" fill="#2B1B3D">?</text>
                  <path d="M36 70 l6 -4 M120 150 l6 4 M126 70 l-5 -5" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </button>
              <p className="center-text bag-hint">{phase === 'tearing' ? 'פותחים…' : 'לוחצים על השקית כדי לפתוח!'}</p>
              <p className="muted center-text">{left} {left === 1 ? 'שקית מחכה' : 'שקיות מחכות'}</p>
            </>
          ) : (
            <div className="card center-text">
              <h2>אין כרגע שקיות</h2>
              <p>כל 10 כוכבים = שקית הפתעה, ועוד שקית בונוס על כל יום שמסיימים אימון יומי.</p>
              <button className="btn btn-primary btn-xl" onClick={() => go({ name: 'play', type: 'daily' })}>לאימון יומי</button>
            </div>
          )}
        </div>
      ) : (
        card && (
          <div className="reveal">
            <div className={`burst r-${card.rarity}`} aria-hidden="true" />
            <div className="reveal-card">
              <SquishyCard def={card} count={copies} size="lg" isNew={copies === 1} onClick={() => undefined} />
            </div>
            <p className="reveal-msg" role="status">{message}</p>
            <p className="muted center-text small">אפשר ללחוץ על הסקווישי כדי למעוך אותו</p>
            <div className="row">
              {bagsAvailable(totalStars(s), s.sessions, s.rewards) > 0 && <button className="btn btn-primary" onClick={again}>לפתוח עוד שקית</button>}
              <button className="btn" onClick={() => go({ name: 'collection' })}>לאלבום ({ownedCounts(s.rewards).size}/{CARDS.length})</button>
            </div>
          </div>
        )
      )}
    </section>
  );
}
