import { CardDef, RARITY_NAME, SHINY_AT } from '../game/cards';

const INK = '#2B1B3D';

function Body({ d }: { d: CardDef }) {
  const fill = d.color2 ? `url(#g-${d.id})` : d.color;
  const p = { fill, stroke: INK, strokeWidth: 4.5, strokeLinejoin: 'round' as const };
  switch (d.shape) {
    case 'mochi':
      return <ellipse cx="60" cy="74" rx="44" ry="32" {...p} />;
    case 'cat':
      return (
        <>
          <path d="M26 52 L30 22 L50 40 Z" {...p} />
          <path d="M94 52 L90 22 L70 40 Z" {...p} />
          <ellipse cx="60" cy="68" rx="40" ry="36" {...p} />
        </>
      );
    case 'bunny':
      return (
        <>
          <ellipse cx="44" cy="30" rx="9" ry="24" {...p} transform="rotate(-10 44 30)" />
          <ellipse cx="76" cy="30" rx="9" ry="24" {...p} transform="rotate(10 76 30)" />
          <ellipse cx="60" cy="74" rx="38" ry="32" {...p} />
        </>
      );
    case 'bear':
      return (
        <>
          <circle cx="30" cy="40" r="13" {...p} />
          <circle cx="90" cy="40" r="13" {...p} />
          <circle cx="60" cy="70" r="38" {...p} />
        </>
      );
    case 'ghost':
      return <path d="M24 100 V62 C24 34 40 24 60 24 C80 24 96 34 96 62 V100 Q88 92 80 100 Q72 92 64 100 Q56 92 48 100 Q40 92 32 100 Q28 96 24 100 Z" {...p} />;
    case 'star':
      return <path d="M60 14 L73 44 L106 47 L81 68 L89 101 L60 84 L31 101 L39 68 L14 47 L47 44 Z" {...p} strokeWidth={5.5} />;
    case 'cloud':
      return (
        <g>
          <g stroke={INK} strokeWidth="9" fill="none">
            <circle cx="38" cy="72" r="20" /><circle cx="60" cy="58" r="26" /><circle cx="84" cy="72" r="20" /><rect x="30" y="66" width="60" height="26" rx="13" />
          </g>
          <g fill={fill}>
            <circle cx="38" cy="72" r="20" /><circle cx="60" cy="58" r="26" /><circle cx="84" cy="72" r="20" /><rect x="30" y="66" width="60" height="26" rx="13" />
          </g>
        </g>
      );
    case 'donut':
      return (
        <>
          <circle cx="60" cy="66" r="40" fill="#E8B27D" stroke={INK} strokeWidth="4.5" />
          <path d="M24 60 C24 34 96 34 96 60 C96 72 88 66 82 74 C76 82 70 70 62 76 C54 82 48 70 40 74 C32 78 24 72 24 60 Z" fill={fill} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        </>
      );
    case 'frog':
      return (
        <>
          <circle cx="40" cy="44" r="15" {...p} />
          <circle cx="80" cy="44" r="15" {...p} />
          <ellipse cx="60" cy="74" rx="44" ry="30" {...p} />
        </>
      );
    case 'octo':
      return (
        <>
          <path d="M30 80 q-6 18 -14 18 M48 86 q-2 16 -8 20 M72 86 q2 16 8 20 M90 80 q6 18 14 18" stroke={INK} strokeWidth="11" strokeLinecap="round" fill="none" />
          <path d="M30 80 q-6 18 -14 18 M48 86 q-2 16 -8 20 M72 86 q2 16 8 20 M90 80 q6 18 14 18" stroke={d.color} strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M22 82 C18 40 36 22 60 22 C84 22 102 40 98 82 Z" {...p} />
        </>
      );
  }
}

function Face({ d }: { d: CardDef }) {
  const y = d.shape === 'frog' ? 44 : d.shape === 'star' ? 60 : d.shape === 'octo' ? 56 : d.shape === 'donut' ? 80 : 68;
  const dx = d.shape === 'frog' ? 20 : 13;
  const dark = d.id === 'r02';
  const eye = dark ? '#fff' : INK;
  return (
    <g>
      {d.extra === 'patches' && (
        <>
          <ellipse cx={60 - dx} cy={y} rx="9" ry="11" fill={INK} transform={`rotate(-20 ${60 - dx} ${y})`} />
          <ellipse cx={60 + dx} cy={y} rx="9" ry="11" fill={INK} transform={`rotate(20 ${60 + dx} ${y})`} />
        </>
      )}
      <ellipse cx={60 - dx} cy={y} rx="4.5" ry="5.5" fill={d.extra === 'patches' ? '#fff' : eye} />
      <ellipse cx={60 + dx} cy={y} rx="4.5" ry="5.5" fill={d.extra === 'patches' ? '#fff' : eye} />
      <circle cx={60 - dx + 1.5} cy={y - 2} r="1.6" fill={d.extra === 'patches' ? INK : dark ? INK : '#fff'} />
      <circle cx={60 + dx + 1.5} cy={y - 2} r="1.6" fill={d.extra === 'patches' ? INK : dark ? INK : '#fff'} />
      <ellipse cx={60 - dx - 7} cy={y + 9} rx="6" ry="3.5" fill="#FF8FB1" opacity=".75" />
      <ellipse cx={60 + dx + 7} cy={y + 9} rx="6" ry="3.5" fill="#FF8FB1" opacity=".75" />
      <path d={`M${54} ${y + 8} q3 4 6 0 q3 4 6 0`} stroke={eye} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Extra({ d }: { d: CardDef }) {
  const top = d.shape === 'bunny' ? 14 : d.shape === 'cat' || d.shape === 'bear' ? 26 : d.shape === 'frog' ? 20 : d.shape === 'star' ? 8 : 36;
  switch (d.extra) {
    case 'bow':
      return (
        <g transform={`translate(80 ${top + 10})`} stroke={INK} strokeWidth="3" fill="#FF5C8A" strokeLinejoin="round">
          <path d="M0 0 L-12 -8 L-12 8 Z" /><path d="M0 0 L12 -8 L12 8 Z" /><circle r="4" />
        </g>
      );
    case 'leaf':
      return <path d={`M60 ${top + 6} q10 -14 22 -8 q-8 12 -22 8 Z`} fill="#5FC46F" stroke={INK} strokeWidth="3" />;
    case 'crown':
      return <path d={`M42 ${top + 6} L46 ${top - 12} L54 ${top - 2} L60 ${top - 16} L66 ${top - 2} L74 ${top - 12} L78 ${top + 6} Z`} fill="#FFC93C" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />;
    case 'horns':
      return (
        <g fill="#FFF3D6" stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
          <path d={`M36 ${top + 14} L30 ${top - 8} L48 ${top + 8} Z`} /><path d={`M84 ${top + 14} L90 ${top - 8} L72 ${top + 8} Z`} />
        </g>
      );
    case 'horn':
      return <path d={`M54 ${top + 4} L60 ${top - 22} L66 ${top + 4} Z`} fill="#FFE27A" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />;
    case 'moon':
      return <path d="M92 14 a12 12 0 1 0 8 20 a9 9 0 1 1 -8 -20 Z" fill="#FFE27A" stroke={INK} strokeWidth="2.5" />;
    case 'drops':
      return (
        <g fill="#6FB6FF" stroke={INK} strokeWidth="2">
          <path d="M40 104 q4 6 0 9 q-4 -3 0 -9 Z" /><path d="M60 108 q4 6 0 9 q-4 -3 0 -9 Z" /><path d="M80 104 q4 6 0 9 q-4 -3 0 -9 Z" />
        </g>
      );
    case 'stars':
      return (
        <g fill="#FFF7B0" stroke={INK} strokeWidth="1.5">
          <path d="M18 24 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 Z" />
          <path d="M100 86 l2 5 5 .5 -4 3.5 1 5 -4 -2.5 -4 2.5 1 -5 -4 -3.5 5 -.5 Z" />
        </g>
      );
    case 'sprinkles':
      return (
        <g strokeWidth="3.5" strokeLinecap="round">
          <path d="M38 56 l5 -3" stroke="#3B9EE8" /><path d="M54 48 l4 4" stroke="#FFC93C" /><path d="M70 50 l5 -2" stroke="#2EC4A0" /><path d="M84 58 l-3 4" stroke="#fff" /><path d="M46 64 l4 2" stroke="#fff" />
        </g>
      );
    default:
      return null;
  }
}

export function SquishyArt({ def, size = 100, locked = false }: { def: CardDef; size?: number; locked?: boolean }) {
  if (locked) {
    const ghost: CardDef = { ...def, color: '#D8CFC0', color2: undefined, extra: 'none' };
    return (
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label="קלף שעוד לא נמצא" className="squishy locked">
        <g opacity=".55"><Body d={ghost} /></g>
        <text x="60" y="80" textAnchor="middle" fontSize="38" fontWeight="700" fill="#8E8576">?</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={def.name} className="squishy">
      {def.color2 && (
        <defs>
          <linearGradient id={`g-${def.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={def.color} />
            <stop offset="1" stopColor={def.color2} />
          </linearGradient>
        </defs>
      )}
      <ellipse cx="60" cy="110" rx="34" ry="5" fill={INK} opacity=".12" />
      <Body d={def} />
      <ellipse cx="44" cy={def.shape === 'frog' ? 64 : 52} rx="9" ry="5" fill="#fff" opacity=".55" transform="rotate(-25 44 52)" />
      <Face d={def} />
      <Extra d={def} />
    </svg>
  );
}

/** A collectible card with rarity frame. count = copies owned (0 = locked). */
export function SquishyCard({ def, count, size = 'md', onClick, isNew }: { def: CardDef; count: number; size?: 'md' | 'lg'; onClick?: () => void; isNew?: boolean }) {
  const locked = count === 0;
  const shiny = count >= SHINY_AT;
  const art = size === 'lg' ? 180 : 76;
  const El = onClick ? 'button' : 'div';
  return (
    <El className={`sq-card r-${def.rarity} ${locked ? 'locked' : ''} ${shiny ? 'shiny' : ''} sz-${size}`} onClick={onClick} aria-label={locked ? `קלף ${RARITY_NAME[def.rarity]} שעוד לא נמצא` : `${def.name}, ${RARITY_NAME[def.rarity]}${count > 1 ? `, ${count} עותקים` : ''}`}>
      <span className="sq-rarity">{locked ? RARITY_NAME[def.rarity] : shiny ? '✨ מבריק' : RARITY_NAME[def.rarity]}</span>
      {isNew && <span className="sq-new">חדש!</span>}
      {count > 1 && <span className="sq-count" dir="ltr">×{count}</span>}
      <span className="sq-art"><SquishyArt def={def} size={art} locked={locked} /></span>
      <span className="sq-name">{locked ? '???' : def.name}</span>
    </El>
  );
}
