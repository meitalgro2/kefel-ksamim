import { useCallback, useState } from 'react';
import { useApp } from '../app-context';
import * as repo from '../db/repo';
import { hashPin } from '../game/play';
import { DRAGONS, Dragon } from '../ui/art';
import { PinPad } from '../ui/common';

export const CONSENT_VERSION = '2026-11-v1';

export default function Onboarding() {
  const { go } = useApp();
  const [step, setStep] = useState<'hello' | 'consent' | 'pin1' | 'pin2'>('hello');
  const [agree, setAgree] = useState(false);
  const [first, setFirst] = useState('');
  const [err, setErr] = useState('');

  const onPin1 = useCallback((p: string) => {
    setFirst(p);
    setErr('');
    setStep('pin2');
  }, []);
  const onPin2 = useCallback(
    async (p: string) => {
      if (p !== first) {
        setErr('הקודים לא תואמים. מתחילים שוב.');
        setStep('pin1');
        return;
      }
      await repo.saveParent({ id: 'parent', auth_id: await hashPin(p), consent_version: CONSENT_VERSION, created_at: Date.now() });
      go({ name: 'addChild' });
    },
    [first, go],
  );

  if (step === 'hello')
    return (
      <section className="screen hello">
        <div className="hello-dragons" aria-hidden="true">
          {DRAGONS.map((d, i) => (
            <div key={d.id} className="pop" style={{ animationDelay: `${i * 90}ms` }}>
              <Dragon def={d} size={92} />
            </div>
          ))}
        </div>
        <h1 className="logo">כפל <span>קסמים</span></h1>
        <p className="lead">לוח הכפל, צעד אחרי צעד, עם דרקון שגדל יחד עם הילד.</p>
        <button className="btn btn-primary btn-xl" onClick={() => setStep('consent')}>התחלה (להורים)</button>
      </section>
    );

  if (step === 'consent')
    return (
      <section className="screen">
        <div className="card">
          <h2>רגע לפני שמתחילים</h2>
          <ul className="bullets">
            <li>כל המידע נשמר רק בטלפון הזה. שום דבר לא נשלח לאינטרנט.</li>
            <li>לילד יש כינוי בלבד. לא שם מלא, לא תמונה ולא פרטים אישיים.</li>
            <li>אין פרסומות ואין צ׳אט.</li>
            <li>אפשר למחוק את כל המידע בכל רגע, ממסך ההורים.</li>
            <li>כדאי לשמור גיבוי מדי פעם (גם הוא במסך ההורים), כי מחיקת האפליקציה מוחקת את ההתקדמות.</li>
          </ul>
          <label className="check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>אני ההורה ומאשר/ת שהילד שלי ישתמש באפליקציה</span>
          </label>
          <button className="btn btn-primary btn-xl" disabled={!agree} onClick={() => setStep('pin1')}>המשך</button>
        </div>
      </section>
    );

  return (
    <section className="screen">
      <div className="card">
        {step === 'pin1' ? (
          <PinPad title="בוחרים קוד הורים" subtitle="4 ספרות. הקוד שומר על דוח ההורים ועל ההגדרות." onDone={onPin1} error={err} />
        ) : (
          <PinPad title="מקלידים את הקוד שוב" onDone={onPin2} />
        )}
      </div>
    </section>
  );
}
