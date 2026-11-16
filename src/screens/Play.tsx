import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app-context';
import { factById } from '../engine/facts';
import { hintFor } from '../engine/hints';
import { choiceOptions, insertRetry, SessionItem } from '../engine/selector';
import { Session, SessionType, uid } from '../engine/types';
import { finishSession, makeQueue, startSession, submitAnswer, syncRewards } from '../game/play';
import { Dragon, dragonById, MONSTERS, Star } from '../ui/art';
import { Keypad, SpeakButton, speak } from '../ui/common';
import { parseAnswer } from '../ui/parseAnswer';
import HintPanel from './HintPanel';

type Phase = 'ask' | 'right' | 'wrong' | 'mediate';
const PRAISE = ['מעולה!', 'יש!', 'בול!', 'אלופים!', 'נכון!', 'וואו!'];

export default function Play({ type, table }: { type: Exclude<SessionType, 'diagnostic'>; table?: number }) {
  const { st, go } = useApp();
  const s = st!;
  const [queue, setQueue] = useState<SessionItem[]>(() => makeQueue(type, s, new Date(), table));
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('ask');
  const [input, setInput] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [praise, setPraise] = useState('');
  const [sessionStars, setSessionStars] = useState(0);
  const session = useRef<Session | null>(null);
  const attemptId = useRef(uid());
  const shownAt = useRef(performance.now());
  const retried = useRef(new Set<string>());
  const dragon = dragonById(s.child.avatar_id);

  const queueRef = useRef(queue);
  queueRef.current = queue;
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const started = useRef(false);

  useEffect(() => {
    if (!queue.length || started.current) return;
    started.current = true;
    startSession(s.child.id, type).then((x) => {
      session.current = x;
      s.sessions.push(x);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const item = queue[idx];
  const fact = item ? factById(item.factId) : null;
  const options = useMemo(() => (fact && item.mode === 'choice' ? choiceOptions(fact) : []), [fact, item]);
  const hint = useMemo(() => (fact ? hintFor(fact.a, fact.b) : null), [fact]);

  useEffect(() => {
    attemptId.current = uid();
    shownAt.current = performance.now();
    if (fact && s.child.settings.readAloud && s.child.age_band === '5-7') speak(`${fact.a} כפול ${fact.b}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const pending = useRef<Promise<unknown>>(Promise.resolve());
  const finishing = useRef(false);
  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    await pending.current; // never close the session while an answer is still being saved
    const ses = session.current;
    if (!ses) return go({ name: 'home' });
    await finishSession(s, ses);
    const fresh = await syncRewards(s, MONSTERS.map((m) => m.id), ses.id);
    go({ name: 'summary', session: { ...ses }, newMonsters: fresh });
  }, [s, go]);

  const next = useCallback(() => {
    setInput('');
    setPicked(null);
    setHintOpen(false);
    setHintUsed(false);
    setPhase('ask');
    const i = idxRef.current;
    if (i + 1 >= queueRef.current.length) finish();
    else setIdx(i + 1);
  }, [finish]);

  const answer = async (value: number | null) => {
    if (!fact || busy || phase !== 'ask' || value === null) return;
    if (!session.current) return;
    setBusy(true);
    setPicked(value);
    const save = submitAnswer(s, session.current, item, value, hintUsed, performance.now() - shownAt.current, attemptId.current);
    pending.current = save.catch(() => undefined);
    const res = await save;
    setSessionStars((x) => x + res.stars);
    const needRetry = (!res.correct || hintUsed) && !retried.current.has(fact.canonical_key);
    if (needRetry) {
      retried.current.add(fact.canonical_key);
      setQueue((q) => insertRetry(q, idx, fact.id));
    }
    if (res.correct) {
      setPraise(hintUsed ? 'נכון! עוד מעט ננסה שוב בלי רמז.' : PRAISE[Math.floor(Math.random() * PRAISE.length)]);
      setPhase('right');
      setTimeout(() => {
        setBusy(false);
        next();
      }, hintUsed ? 1600 : 900);
    } else {
      setPhase('wrong');
      setBusy(false);
    }
  };

  if (!queue.length)
    return (
      <section className="screen center">
        <Dragon def={dragon} size={170} mood="calm" />
        <div className="bubble"><p>אין כרגע תרגילים לחזרה. {dragon.name} נח, ונמשיך מחר!</p></div>
        <button className="btn btn-primary btn-xl" onClick={() => go({ name: 'home' })}>חזרה הביתה</button>
      </section>
    );
  if (!fact || !hint) return null;

  const value = parseAnswer(input);
  const shownInput = phase === 'ask' ? input || '?' : phase === 'mediate' ? input || '?' : String(picked ?? '?');
  const title = type === 'daily' ? 'אימון יומי' : type === 'choice_game' ? 'משחק בחירה' : table ? `כפולת ${table}` : 'משחק הקלדה';

  return (
    <section className="screen play">
      <div className="play-top">
        <button className="btn btn-small" disabled={busy} onClick={finish} aria-label="סיום האימון">סיום</button>
        <span className="play-title">{title}</span>
        <span className="star-pill"><Star /> {sessionStars}</span>
      </div>
      <div className="dots-progress" aria-label={`תרגיל ${idx + 1} מתוך ${queue.length}`}>
        {queue.map((q, i) => (
          <span key={i} className={i < idx ? 'done' : i === idx ? 'now' : ''} />
        ))}
      </div>

      <div className={`problem-card card ${phase}`}>
        <div className="problem-row">
          <div className="problem" dir="ltr" aria-live="polite">
            {fact.a} × {fact.b} = <span className={`answer-box ${phase}`}>{phase === 'wrong' ? fact.answer : shownInput}</span>
          </div>
          {s.child.settings.readAloud && <SpeakButton text={`${fact.a} כפול ${fact.b}`} />}
        </div>
        {item.kind === 'retry' && phase === 'ask' && <p className="tag">שוב, הפעם לבד 💪</p>}
        {phase === 'right' && <p className="feedback good pop">✓ {praise}</p>}
        {phase === 'wrong' && (
          <p className="feedback soft">
            ענית {picked}. התשובה היא <b className="ltr">{fact.a} × {fact.b} = {fact.answer}</b>
          </p>
        )}
      </div>

      {phase === 'ask' && item.mode === 'choice' && (
        <div className="choices">
          {options.map((o) => (
            <button key={o} className="choice" disabled={busy} onClick={() => answer(o)}>{o}</button>
          ))}
        </div>
      )}
      {(phase === 'ask' || phase === 'right') && item.mode === 'typed' && (
        <Keypad
          disabled={busy || phase !== 'ask'}
          okDisabled={value === null}
          onDigit={(d) => setInput((x) => (x.length < 3 ? x + d : x))}
          onBack={() => setInput((x) => x.slice(0, -1))}
          onOk={() => answer(value)}
        />
      )}
      {phase === 'ask' && !hintOpen && (
        <button className="btn btn-ghost" onClick={() => { setHintOpen(true); setHintUsed(true); }}>💡 רמז</button>
      )}
      {hintOpen && phase === 'ask' && <HintPanel hint={hint} />}

      {phase === 'wrong' && (
        <>
          <HintPanel hint={hint} />
          <button className="btn btn-primary btn-xl" onClick={() => { setInput(''); setPhase('mediate'); }}>בואו נתרגל את זה</button>
        </>
      )}
      {phase === 'mediate' && (
        <>
          <p className="center-text">מקלידים את התשובה: <b className="ltr">{fact.a} × {fact.b} = {fact.answer}</b></p>
          <Keypad
            okLabel="המשך"
            okDisabled={parseAnswer(input) !== fact.answer}
            onDigit={(d) => setInput((x) => (x.length < 3 ? x + d : x))}
            onBack={() => setInput((x) => x.slice(0, -1))}
            onOk={next}
          />
          <p className="muted center-text">עוד כמה תרגילים נחזור אליו, ואז מנסים לבד.</p>
        </>
      )}
    </section>
  );
}
