import { useEffect, useState } from 'react';
import { useApp } from '../app-context';
import * as repo from '../db/repo';
import { Child } from '../engine/types';
import { DRAGONS, Dragon } from '../ui/art';

export default function DragonPick({ childId, fromParent }: { childId: string; fromParent?: boolean }) {
  const { go, selectChild, st } = useApp();
  const [child, setChild] = useState<Child | null>(null);
  const [pick, setPick] = useState<string>('ember');
  useEffect(() => {
    repo.getChild(childId).then((c) => {
      if (c) {
        setChild(c);
        setPick(c.avatar_id);
      }
    });
  }, [childId]);
  if (!child) return null;
  const chosen = DRAGONS.find((d) => d.id === pick)!;

  const save = async () => {
    await repo.saveChild({ ...child, avatar_id: pick });
    // from the parent area, only refresh if this is the active player; never switch players
    if (!fromParent || st?.child.id === child.id) await selectChild(child.id);
    go({ name: fromParent ? 'parent' : child.settings.diagnosticDone ? 'home' : 'diagnostic' });
  };

  return (
    <section className="screen">
      <h1 className="page-title">{child.nickname}, איזה דרקון יגדל איתך?</h1>
      <div className="dragon-hero">
        <Dragon def={chosen} size={190} mood="wow" />
        <p className="dragon-caption"><b>{chosen.name}</b> · {chosen.trait}</p>
      </div>
      <div className="dragon-grid" role="radiogroup" aria-label="בחירת דרקון">
        {DRAGONS.map((d) => (
          <button key={d.id} role="radio" aria-checked={pick === d.id} className={`dragon-opt ${pick === d.id ? 'on' : ''}`} onClick={() => setPick(d.id)}>
            <Dragon def={d} size={72} />
            <span>{pick === d.id ? '✓ ' : ''}{d.name}</span>
          </button>
        ))}
      </div>
      <button className="btn btn-primary btn-xl" onClick={save}>זה הדרקון שלי!</button>
    </section>
  );
}
