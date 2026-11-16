// Hand-built SVG characters. No external images.

export type DragonDef = { id: string; name: string; body: string; belly: string; accent: string; trait: string };

export const DRAGONS: DragonDef[] = [
  { id: 'ember', name: 'ניצוץ', body: '#FF7A1A', belly: '#FFD9A8', accent: '#C2410C', trait: 'יורק ניצוצות של שמחה' },
  { id: 'wave', name: 'אדווה', body: '#3B9EE8', belly: '#CDE9FF', accent: '#1D5FA8', trait: 'שוחה בים של מספרים' },
  { id: 'leaf', name: 'עלעל', body: '#2FB67C', belly: '#D2F5DF', accent: '#16794F', trait: 'גדל מכל תרגיל' },
  { id: 'berry', name: 'פטל', body: '#E84A7F', belly: '#FFD3E2', accent: '#A31D4E', trait: 'אוהב אתגרים מתוקים' },
];

export function dragonById(id: string): DragonDef {
  return DRAGONS.find((d) => d.id === id) ?? DRAGONS[0];
}

/** stage 0 = baby, 1 = young (wings), 2 = grand (wings + crown + flame). */
export function dragonStage(trainingDays: number): 0 | 1 | 2 {
  return trainingDays >= 7 ? 2 : trainingDays >= 3 ? 1 : 0;
}
export const STAGE_NAMES = ['דרקון תינוק', 'דרקון צעיר', 'דרקון אגדי'];

const INK = '#2B1B3D';

export function Dragon({ def, stage = 0, size = 160, mood = 'happy' }: { def: DragonDef; stage?: number; size?: number; mood?: 'happy' | 'wow' | 'calm' }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={`הדרקון ${def.name}`} className="dragon">
      {stage >= 1 && (
        <g className="wing">
          <path d="M62 92 C20 60 14 112 40 128 C48 112 56 110 66 112 Z" fill={def.accent} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <path d="M138 92 C180 60 186 112 160 128 C152 112 144 110 134 112 Z" fill={def.accent} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        </g>
      )}
      {/* tail */}
      <path d="M140 160 C170 166 182 150 176 134 L188 128 L172 124 C176 142 160 152 136 146 Z" fill={def.body} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      {/* body */}
      <ellipse cx="100" cy="140" rx="48" ry="44" fill={def.body} stroke={INK} strokeWidth="5" />
      <ellipse cx="100" cy="148" rx="28" ry="30" fill={def.belly} />
      <path d="M84 136 h32 M82 150 h36 M86 164 h28" stroke={def.accent} strokeWidth="3" strokeLinecap="round" opacity=".5" />
      {/* feet */}
      <ellipse cx="74" cy="182" rx="16" ry="9" fill={def.body} stroke={INK} strokeWidth="5" />
      <ellipse cx="126" cy="182" rx="16" ry="9" fill={def.body} stroke={INK} strokeWidth="5" />
      {/* horns */}
      <path d="M70 56 L60 24 L86 46 Z" fill={def.belly} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M130 56 L140 24 L114 46 Z" fill={def.belly} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      {/* head */}
      <circle cx="100" cy="78" r="44" fill={def.body} stroke={INK} strokeWidth="5" />
      <ellipse cx="100" cy="96" rx="26" ry="16" fill={def.belly} />
      <circle cx="91" cy="92" r="3" fill={INK} />
      <circle cx="109" cy="92" r="3" fill={INK} />
      {/* eyes */}
      {mood === 'calm' ? (
        <>
          <path d="M72 72 q8 -8 16 0" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M112 72 q8 -8 16 0" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="80" cy="70" r={mood === 'wow' ? 12 : 10} fill="#fff" stroke={INK} strokeWidth="4" />
          <circle cx="120" cy="70" r={mood === 'wow' ? 12 : 10} fill="#fff" stroke={INK} strokeWidth="4" />
          <circle cx="82" cy="71" r="5" fill={INK} />
          <circle cx="122" cy="71" r="5" fill={INK} />
          <circle cx="84" cy="68" r="1.8" fill="#fff" />
          <circle cx="124" cy="68" r="1.8" fill="#fff" />
        </>
      )}
      <path d={mood === 'wow' ? 'M94 106 q6 10 12 0 z' : 'M90 104 q10 8 20 0'} stroke={INK} strokeWidth="4" fill={mood === 'wow' ? INK : 'none'} strokeLinecap="round" />
      <circle cx="66" cy="88" r="6" fill="#FF9DB5" opacity=".7" />
      <circle cx="134" cy="88" r="6" fill="#FF9DB5" opacity=".7" />
      {stage >= 2 && (
        <g>
          <path d="M78 36 L84 16 L94 30 L100 10 L106 30 L116 16 L122 36 Z" fill="#FFC93C" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <circle cx="100" cy="24" r="3.5" fill="#E84A7F" />
        </g>
      )}
    </svg>
  );
}

export function Star({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="star-icon">
      <path d="M12 2.5 L14.8 8.6 L21.5 9.3 L16.5 13.8 L17.9 20.4 L12 17 L6.1 20.4 L7.5 13.8 L2.5 9.3 L9.2 8.6 Z" fill="#FFC93C" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
