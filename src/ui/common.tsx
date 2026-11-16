import { ReactNode, useEffect, useState } from 'react';

export function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    const he = synth.getVoices().find((v) => v.lang.startsWith('he') || v.lang.startsWith('iw'));
    if (he) u.voice = he;
    u.rate = 0.9;
    synth.speak(u);
  } catch {
    /* read-aloud is optional */
  }
}

export function SpeakButton({ text }: { text: string }) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  return (
    <button className="icon-btn" onClick={() => speak(text)} aria-label="הקראה בקול">
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        <path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <span>הקראה</span>
    </button>
  );
}

/** Big on-screen number pad. Digits are laid out like a phone (LTR inside). */
export function Keypad({ onDigit, onBack, onOk, okLabel = 'בדיקה', disabled, okDisabled }: {
  onDigit: (d: string) => void;
  onBack: () => void;
  onOk: () => void;
  okLabel?: string;
  disabled?: boolean;
  okDisabled?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (disabled) return;
      if (/^[0-9]$/.test(e.key)) onDigit(e.key);
      else if (e.key === 'Backspace') onBack();
      else if (e.key === 'Enter' && !okDisabled) onOk();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onDigit, onBack, onOk, disabled, okDisabled]);
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return (
    <div className="keypad" dir="ltr">
      {keys.map((k) => (
        <button key={k} className="key" disabled={disabled} onClick={() => onDigit(k)}>{k}</button>
      ))}
      <button className="key key-back" disabled={disabled} onClick={onBack} aria-label="מחיקה">⌫</button>
      <button className="key" disabled={disabled} onClick={() => onDigit('0')}>0</button>
      <button className="key key-ok" disabled={disabled || okDisabled} onClick={onOk}>{okLabel}</button>
    </div>
  );
}

export function PinPad({ title, subtitle, onDone, error }: { title: string; subtitle?: string; onDone: (pin: string) => void; error?: string }) {
  const [pin, setPin] = useState('');
  useEffect(() => {
    if (pin.length === 4) {
      const p = pin;
      const t = setTimeout(() => {
        setPin('');
        onDone(p);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [pin, onDone]);
  return (
    <div className="pinpad">
      <h2>{title}</h2>
      {subtitle && <p className="muted">{subtitle}</p>}
      <div className="pin-dots" aria-label={`הוקלדו ${pin.length} ספרות מתוך 4`} dir="ltr">
        {[0, 1, 2, 3].map((i) => <span key={i} className={i < pin.length ? 'on' : ''} />)}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <Keypad
        onDigit={(d) => setPin((p) => (p.length < 4 ? p + d : p))}
        onBack={() => setPin((p) => p.slice(0, -1))}
        onOk={() => undefined}
        okDisabled
        okLabel=" "
      />
    </div>
  );
}

export function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function TopBar({ title, onBack, right }: { title?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="topbar">
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label="חזרה">
          <span aria-hidden="true">→</span> <span>חזרה</span>
        </button>
      ) : <span />}
      {title && <h1 className="topbar-title">{title}</h1>}
      <div className="topbar-right">{right}</div>
    </header>
  );
}
