// Survey illustrations — one visual system.
//
// Rules every piece follows, so the set reads as one family:
//  • 120×80 canvas on the same soft blue tint, rounded corners.
//  • Flat fills only: no outlines, gradients or filters.
//  • One palette (below). Brand blue is the "subject", yellow = sun/energy,
//    green = nature/charging, slate = structure.
//  • Houses and cars are single shared components, so every scene that
//    contains one looks identical.

const BG = '#EEF4FF';
const GROUND = '#DCE8F9';
const BLUE = '#186CDD';
const BLUE_LIGHT = '#CFE0FB';
const SLATE = '#3B4A63';
const SLATE_LIGHT = '#94A3B8';
const WHITE = '#FFFFFF';
const SUN = '#FFC53D';
const SUN_LIGHT = '#FFE29A';
const GREEN = '#34B16B';
const GREEN_DARK = '#1F8F52';
const NIGHT = '#1E2A4A';

export type ArtName =
  | 'roof-small'
  | 'roof-medium'
  | 'roof-large'
  | 'dir-south'
  | 'dir-east'
  | 'dir-west'
  | 'dir-north'
  | 'shade-none'
  | 'shade-partial'
  | 'shade-heavy'
  | 'dollar-1'
  | 'dollar-2'
  | 'dollar-3'
  | 'charge-home'
  | 'charge-public'
  | 'offpeak-yes'
  | 'offpeak-no'
  | 'custom'
  | 'unknown';

function Frame({ children, bg = BG }: { children: React.ReactNode; bg?: string }) {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="100%" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="120" height="80" fill={bg} />
      {children}
    </svg>
  );
}

// ─── Shared building blocks ─────────────────────────────────────────────────

/** Front-facing house. Origin = top-left of the wall; wall is 44×26. */
function House({ x, y, s = 1, panel = false }: { x: number; y: number; s?: number; panel?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-3 2L22-15 47 2" fill="none" stroke={SLATE} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      {panel && <rect x="12" y="-9" width="20" height="8" rx="2" fill={BLUE} transform="rotate(-2 22 -5)" />}
      <rect width="44" height="26" rx="3" fill={WHITE} />
      <rect x="6" y="9" width="10" height="9" rx="2" fill={BLUE_LIGHT} />
      <rect x="28" y="6" width="9" height="20" rx="2" fill={BLUE_LIGHT} />
    </g>
  );
}

/** Side-view EV facing right. Origin = top-left; 34×15. */
function Car({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M1 11V8.6Q1 7 2.8 6.6L8 5.2Q10 1.5 14 1.5H21Q24 1.5 26 5L30 6.2Q33 6.8 33 9V11Q33 12 32 12H2Q1 12 1 11Z" fill={BLUE} />
      <path d="M10.2 5Q11.5 3.1 14 3.1H16.2V5Z" fill={BLUE_LIGHT} />
      <path d="M17.6 3.1H21Q22.6 3.1 23.7 5H17.6Z" fill={BLUE_LIGHT} />
      <circle cx="9.5" cy="12" r="3.2" fill={SLATE} />
      <circle cx="9.5" cy="12" r="1.2" fill={WHITE} />
      <circle cx="25" cy="12" r="3.2" fill={SLATE} />
      <circle cx="25" cy="12" r="1.2" fill={WHITE} />
    </g>
  );
}

function Bolt({ x, y, s = 1, fill = WHITE }: { x: number; y: number; s?: number; fill?: string }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M3 0L0 6.5h3L2 12l5-7H4l2-5z" fill={fill} />;
}

function Sun({ x, y, r, rays = true }: { x: number; y: number; r: number; rays?: boolean }) {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <g>
      {rays &&
        angles.map((a) => (
          <rect
            key={a}
            x={x - 1.3}
            y={y - r - 6}
            width="2.6"
            height="4.5"
            rx="1.3"
            fill={SUN}
            transform={`rotate(${a} ${x} ${y})`}
          />
        ))}
      <circle cx={x} cy={y} r={r} fill={SUN} />
    </g>
  );
}

function Tree({ x, y, s = 1, dark = false }: { x: number; y: number; s?: number; dark?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1.6" y="9" width="3.2" height="9" rx="1.2" fill={SLATE} />
      <circle cx="0" cy="5" r="9.5" fill={dark ? GREEN_DARK : GREEN} />
    </g>
  );
}

// ─── Roof size ──────────────────────────────────────────────────────────────

/** Solar roof; `top` + `bottom` = how many panels in the upper / lower row. */
function RoofArt({ top, bottom }: { top: number; bottom: number }) {
  const pitch = 12;
  const row = (count: number, y: number) =>
    Array.from({ length: count }).map((_, i) => (
      <rect key={`${y}-${i}`} x={60 - (count * pitch - 2) / 2 + i * pitch} y={y} width="10" height="9" rx="2" fill={BLUE} />
    ));
  return (
    <Frame>
      <rect y="64" width="120" height="16" fill={GROUND} />
      <path d="M12 46L34 16H86L108 46Z" fill={SLATE} />
      {row(top, 19)}
      {row(bottom, 31)}
      <rect x="22" y="46" width="76" height="22" rx="3" fill={WHITE} />
      <rect x="31" y="53" width="12" height="8" rx="2" fill={BLUE_LIGHT} />
      <rect x="77" y="53" width="12" height="8" rx="2" fill={BLUE_LIGHT} />
      <rect x="54" y="52" width="12" height="16" rx="2" fill={BLUE_LIGHT} />
    </Frame>
  );
}

// ─── Roof direction ─────────────────────────────────────────────────────────

function DirArt({ dir }: { dir: 'north' | 'east' | 'south' | 'west' }) {
  const angle = { north: 0, east: 90, south: 180, west: 270 }[dir];
  const letters: { l: string; x: number; y: number; d: typeof dir }[] = [
    { l: 'N', x: 60, y: 20, d: 'north' },
    { l: 'E', x: 83, y: 43, d: 'east' },
    { l: 'S', x: 60, y: 66, d: 'south' },
    { l: 'W', x: 37, y: 43, d: 'west' },
  ];
  return (
    <Frame>
      <circle cx="60" cy="40" r="31" fill={WHITE} />
      <circle cx="60" cy="40" r="31" fill="none" stroke={BLUE_LIGHT} strokeWidth="3" />
      {letters.map(({ l, x, y, d }) => (
        <text key={l} x={x} y={y} fontSize="9" fontWeight="800" textAnchor="middle" fill={d === dir ? BLUE : SLATE_LIGHT}>
          {l}
        </text>
      ))}
      <g transform={`rotate(${angle} 60 40)`}>
        <path d="M60 29L65 40H55Z" fill={BLUE} strokeLinejoin="round" stroke={BLUE} strokeWidth="2" />
        <path d="M60 51L65 40H55Z" fill={BLUE_LIGHT} strokeLinejoin="round" stroke={BLUE_LIGHT} strokeWidth="2" />
      </g>
      <circle cx="60" cy="40" r="3" fill={WHITE} />
      <circle cx="60" cy="40" r="1.6" fill={SLATE} />
    </Frame>
  );
}

// ─── Shade ──────────────────────────────────────────────────────────────────

function ShadeArt({ level }: { level: 'none' | 'partial' | 'heavy' }) {
  return (
    <Frame bg={level === 'heavy' ? '#DCE3EE' : BG}>
      <rect y="64" width="120" height="16" fill={level === 'heavy' ? '#CBD5E3' : GROUND} />
      {level === 'none' && <Sun x={96} y={20} r={8} />}
      {level === 'partial' && (
        <>
          <Sun x={96} y={20} r={8} rays={false} />
          <ellipse cx="92" cy="24" rx="13" ry="6.5" fill={WHITE} />
          <ellipse cx="102" cy="20" rx="8" ry="5.5" fill={WHITE} />
        </>
      )}
      {level === 'heavy' && (
        <>
          <ellipse cx="84" cy="16" rx="16" ry="7" fill={WHITE} opacity="0.9" />
          <ellipse cx="96" cy="12" rx="10" ry="6" fill={WHITE} opacity="0.9" />
        </>
      )}
      <House x={38} y={42} panel />
      {level === 'partial' && <Tree x={22} y={46} s={1.05} />}
      {level === 'heavy' && (
        <>
          <Tree x={24} y={44} s={1.25} dark />
          <Tree x={96} y={44} s={1.25} dark />
          <Tree x={42} y={34} s={1.1} />
          <Tree x={78} y={34} s={1.1} />
        </>
      )}
    </Frame>
  );
}

// ─── Install price ──────────────────────────────────────────────────────────

function DollarArt({ n }: { n: 1 | 2 | 3 }) {
  return (
    <Frame>
      <text x="60" y="54" fontSize={n === 1 ? 44 : n === 2 ? 38 : 32} fontWeight="800" textAnchor="middle" fill={BLUE} letterSpacing="1">
        {'$'.repeat(n)}
      </text>
    </Frame>
  );
}

// ─── Charging ───────────────────────────────────────────────────────────────

function HomeChargeArt() {
  return (
    <Frame>
      <rect y="64" width="120" height="16" fill={GROUND} />
      <House x={10} y={38} />
      <rect x="52" y="48" width="7" height="12" rx="2" fill={GREEN} />
      <path d="M59 56Q70 56 72 62" fill="none" stroke={SLATE} strokeWidth="2" strokeLinecap="round" />
      <Car x={72} y={51} s={1.1} />
    </Frame>
  );
}

function PublicChargeArt() {
  return (
    <Frame>
      <rect y="64" width="120" height="16" fill={GROUND} />
      <rect x="16" y="16" width="24" height="48" rx="5" fill={WHITE} />
      <rect x="21" y="21" width="14" height="14" rx="3" fill={GREEN} />
      <Bolt x={25.5} y={22.5} s={0.9} />
      <rect x="22" y="43" width="12" height="3" rx="1.5" fill={BLUE_LIGHT} />
      <path d="M40 48Q56 48 58 60" fill="none" stroke={SLATE} strokeWidth="2" strokeLinecap="round" />
      <Car x={66} y={51} s={1.1} />
    </Frame>
  );
}

function OffPeakArt({ night }: { night: boolean }) {
  return night ? (
    <Frame bg={NIGHT}>
      <path d="M70 18a22 22 0 1 0 14 38A17 17 0 0 1 70 18z" fill={SUN_LIGHT} />
      <circle cx="30" cy="22" r="1.8" fill={WHITE} />
      <circle cx="46" cy="12" r="1.3" fill={WHITE} />
      <circle cx="26" cy="50" r="1.3" fill={WHITE} />
      <circle cx="98" cy="22" r="1.5" fill={WHITE} />
      <circle cx="102" cy="56" r="1.2" fill={WHITE} />
    </Frame>
  ) : (
    <Frame>
      <Sun x={60} y={40} r={14} />
    </Frame>
  );
}

// ─── Generic ────────────────────────────────────────────────────────────────

function CustomArt() {
  return (
    <Frame>
      <rect x="14" y="29" width="62" height="22" rx="6" fill={WHITE} />
      <rect x="22" y="38" width="22" height="4" rx="2" fill={BLUE_LIGHT} />
      <rect x="50" y="33.5" width="2.4" height="13" rx="1.2" fill={BLUE} />
      <g transform="rotate(40 88 44)">
        <rect x="82" y="22" width="12" height="30" rx="3" fill={BLUE} />
        <path d="M82 52h12l-6 9z" fill={SUN_LIGHT} />
        <path d="M85.2 58.4h5.6L88 62z" fill={SLATE} />
      </g>
    </Frame>
  );
}

function UnknownArt() {
  return (
    <Frame>
      <circle cx="60" cy="40" r="22" fill={WHITE} />
      <text x="60" y="51" fontSize="30" fontWeight="800" textAnchor="middle" fill={BLUE}>?</text>
    </Frame>
  );
}

export function Art({ name }: { name: ArtName }) {
  switch (name) {
    case 'roof-small': return <RoofArt top={0} bottom={2} />;
    case 'roof-medium': return <RoofArt top={2} bottom={4} />;
    case 'roof-large': return <RoofArt top={4} bottom={6} />;
    case 'dir-south': return <DirArt dir="south" />;
    case 'dir-east': return <DirArt dir="east" />;
    case 'dir-west': return <DirArt dir="west" />;
    case 'dir-north': return <DirArt dir="north" />;
    case 'shade-none': return <ShadeArt level="none" />;
    case 'shade-partial': return <ShadeArt level="partial" />;
    case 'shade-heavy': return <ShadeArt level="heavy" />;
    case 'dollar-1': return <DollarArt n={1} />;
    case 'dollar-2': return <DollarArt n={2} />;
    case 'dollar-3': return <DollarArt n={3} />;
    case 'charge-home': return <HomeChargeArt />;
    case 'charge-public': return <PublicChargeArt />;
    case 'offpeak-yes': return <OffPeakArt night />;
    case 'offpeak-no': return <OffPeakArt night={false} />;
    case 'custom': return <CustomArt />;
    case 'unknown': return <UnknownArt />;
  }
}
