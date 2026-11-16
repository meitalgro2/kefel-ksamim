import { useCallback, useEffect, useRef, useState } from 'react';
import { Ctx, Screen, lastChild, rememberChild } from './app-context';
import * as repo from './db/repo';
import { ChildState, loadChildState } from './game/play';
import Onboarding from './screens/Onboarding';
import Profiles from './screens/Profiles';
import AddChild from './screens/AddChild';
import DragonPick from './screens/DragonPick';
import Diagnostic from './screens/Diagnostic';
import Home from './screens/Home';
import TableMap from './screens/TableMap';
import Play from './screens/Play';
import Summary from './screens/Summary';
import Collection from './screens/Collection';
import Parent from './screens/Parent';

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'loading' });
  const [st, setSt] = useState<ChildState | null>(null);
  const activeId = useRef<string | null>(null);

  const selectChild = useCallback(async (id: string | null) => {
    rememberChild(id);
    activeId.current = id;
    const next = id ? await loadChildState(id) : null;
    if (activeId.current === id) setSt(next);
  }, []);

  const reload = useCallback(async () => {
    if (!st) return;
    const id = st.child.id;
    const next = await loadChildState(id);
    if (activeId.current === id) setSt(next); // ignore if the player changed meanwhile
  }, [st]);

  useEffect(() => {
    (async () => {
      const parent = await repo.getParent();
      if (!parent) return setScreen({ name: 'onboarding' });
      const kids = await repo.listChildren();
      if (!kids.length) return setScreen({ name: 'addChild' });
      const last = lastChild();
      const pick = kids.find((k) => k.id === last) ?? (kids.length === 1 ? kids[0] : null);
      if (pick) {
        activeId.current = pick.id;
        const s = await loadChildState(pick.id);
        setSt(s);
        return setScreen(s?.child.settings.diagnosticDone ? { name: 'home' } : { name: 'diagnostic' });
      }
      setScreen({ name: 'profiles' });
    })();
  }, []);

  useEffect(() => {
    const young = st?.child.age_band === '5-7';
    document.body.classList.toggle('young', !!young);
    document.body.classList.toggle('calm', !!st?.child.settings.reduceMotion);
  }, [st]);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    window.scrollTo(0, 0);
  }, []);

  return (
    <Ctx.Provider value={{ go, st, selectChild, reload }}>
      <main className="app" key={screen.name}>
        {screen.name === 'loading' && <div className="center-fill"><div className="spinner" aria-label="טוען" /></div>}
        {screen.name === 'onboarding' && <Onboarding />}
        {screen.name === 'profiles' && <Profiles />}
        {screen.name === 'addChild' && <AddChild />}
        {screen.name === 'dragon' && <DragonPick childId={screen.childId} fromParent={screen.fromParent} />}
        {screen.name === 'diagnostic' && st && <Diagnostic />}
        {screen.name === 'home' && st && <Home />}
        {screen.name === 'map' && st && <TableMap />}
        {screen.name === 'play' && st && <Play type={screen.type} table={screen.table} />}
        {screen.name === 'summary' && st && <Summary session={screen.session} newMonsters={screen.newMonsters} />}
        {screen.name === 'collection' && st && <Collection />}
        {screen.name === 'parent' && <Parent />}
      </main>
    </Ctx.Provider>
  );
}
