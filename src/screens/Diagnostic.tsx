import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app-context';
import * as repo from '../db/repo';
import { diagnosticLength, nextDiagnosticItem, DiagResult } from '../engine/diagnostic';
import { Fact } from '../engine/facts';
import { Session, uid } from '../engine/types';
import { finishSession, startSession, submitAnswer } from '../game/play';
import { Dragon, dragonById } from '../ui/art';
import { Keypad, SpeakButton } from '../ui/common';
import { parseAnswer } from '../ui/parseAnswer';

export default function Diagnostic() {
  const { st, go, reload } = useApp();
  const child = st!.child;
  const [phase, setPhase] = useState<'intro' | 'ask' | 'done'>('intro');
  const [session, setSession] = useState<Session | null>(null);
  const [results, setResults] = useState<DiagResult[]>([]);
  const [fact, setFact] = useState<Fact | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [ack, setAck] = useState(false);
  const attemptId = useRef(uid());
  const shownAt = useRef(performance.now());

  // Resume an unfinished diagnostic so leaving mid-way loses nothing.
  const existing = useMemo(() => st!.sessions.find((s) => s.type === 'diagnostic' && !s.finished_at), [st]);

  const ask = useCallback((res: DiagResult[]) => {
    const f = nextDiagnosticItem(res);
    attemptId.current = uid();
    shownAt.current = performance.now();
    setInput('');
    setFact(f);
    return f;
  }, []);

  const begin = async () => {
    if (busy) return;
    setBusy(true);
    let s = existing ?? null;
    let res: DiagResult[] = [];
    if (s) res = st!.attempts.filter((a) => a.session_id === s!.id).map((a) => ({ factId: a.fact_id, correct: a.correct }));
    else {
      s = await startSession(child.id, 'diagnostic');
      st!.sessions.push(s);
    }
    setSession(s);
    setResults(res);
    if (ask(res)) setPhase('ask');
    else await end(s);
    setBusy(false);
  };

  const end = async (s: Session) => {
    await finishSession(st!, s);
    const baseline = [...st!.cfs.values()].filter((c) => c.mastery_level >= 2).length;
    await repo.saveChild({ ...child, settings: { ...child.settings, diagnosticDone: true, diagnosticBaseline: baseline } });
    setPhase('done');
  };

  const answer = async (value: number | null) => {
    if (!fact || !session || busy) return;
    setBusy(true);
    await submitAnswer(st!, session, { factId: fact.id, mode: 'typed' }, value, false, performance.now() - shownAt.current, attemptId.current);
    const res = [...results, { factId: fact.id, correct: value === fact.answer }];
    setResults(res);
    setAck(true);
    setTimeout(async () => {
      setAck(false);
      if (!ask(res)) await end(session);
      setBusy(false);
    }, 450);
  };

  useEffect(() => {
    if (phase === 'done') reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const dragon = dragonById(child.avatar_id);

  if (phase === 'intro')
    return (
      <section className="screen center">
        <Dragon def={dragon} size={170} />
        <div className="bubble">
          <p><b>היי {child.nickname}!</b> אני {dragon.name}.</p>
          <p>בואו נראה מה כבר יודעים. אין פה ציון ואין טעויות “רעות”. אם עוד לא למדת תרגיל, פשוט לוחצים “עוד לא למדתי”.</p>
        </div>
        <button className="btn btn-primary btn-xl" disabled={busy} onClick={begin}>{existing ? 'ממשיכים מאיפה שעצרנו' : 'יאללה, מתחילים'}</button>
      </section>
    );

  if (phase === 'done') {
    const correct = results.filter((r) => r.correct).length;
    return (
      <section className="screen center">
        <Dragon def={dragon} size={170} mood="wow" />
        <div className="bubble">
          <p><b>סיימנו את משחק הפתיחה!</b></p>
          <p>ענית נכון על {correct} מתוך {results.length}. מחר נבדוק שוב את מה שהצלחת, כדי לוודא שזה נשאר בזיכרון.</p>
        </div>
        <button className="btn btn-primary btn-xl" onClick={() => go({ name: 'home' })}>לבית של {dragon.name}</button>
      </section>
    );
  }

  const total = diagnosticLength(results);
  const value = parseAnswer(input);
  return (
    <section className="screen play">
      <div className="progress" aria-label={`שאלה ${results.length + 1}`}>
        <div className="progress-fill" style={{ width: `${(results.length / total) * 100}%` }} />
      </div>
      {fact && (
        <>
          <div className="problem-row">
            <div className="problem" dir="ltr" aria-live="polite">
              {fact.a} × {fact.b} = <span className={`answer-box ${ack ? 'ack' : ''}`}>{input || '?'}</span>
            </div>
            {child.settings.readAloud && <SpeakButton text={`${fact.a} כפול ${fact.b}`} />}
          </div>
          <p className="muted center-text">{ack ? 'קיבלתי! ✓' : 'מקלידים את התשובה'}</p>
          <Keypad
            disabled={busy}
            okDisabled={value === null}
            onDigit={(d) => setInput((s) => (s.length < 3 ? s + d : s))}
            onBack={() => setInput((s) => s.slice(0, -1))}
            onOk={() => answer(value)}
          />
          <button className="btn btn-ghost" disabled={busy} onClick={() => answer(null)}>עוד לא למדתי</button>
        </>
      )}
    </section>
  );
}
