import { useEffect, useState } from 'react';
import { useApp } from '../app-context';
import * as repo from '../db/repo';
import { Child } from '../engine/types';
import { Dragon, dragonById } from '../ui/art';

export default function Profiles() {
  const { go, selectChild } = useApp();
  const [kids, setKids] = useState<Child[] | null>(null);
  useEffect(() => {
    repo.listChildren().then(setKids);
  }, []);

  const pick = async (c: Child) => {
    await selectChild(c.id);
    go({ name: c.settings.diagnosticDone ? 'home' : 'diagnostic' });
  };

  return (
    <section className="screen">
      <h1 className="page-title">מי משחק עכשיו?</h1>
      <div className="profile-grid">
        {kids?.map((c) => (
          <button key={c.id} className="profile card" onClick={() => pick(c)}>
            <Dragon def={dragonById(c.avatar_id)} size={110} />
            <span className="profile-name">{c.nickname}</span>
          </button>
        ))}
      </div>
      <button className="btn btn-ghost" onClick={() => go({ name: 'parent' })}>הוספת ילד / הורים</button>
    </section>
  );
}
