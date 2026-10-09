// Survey illustrations — one visual system, modelled on Apple's Weather icons.
//
//  • 120×80 tile on a soft, neutral light-grey gradient with a hint of blue.
//  • Glossy white→pale-blue clouds, a golden sun with light rays, flat shapes.
//  • ONE house (the roof-size house) is reused everywhere a house appears, so
//    roof size, shade and home charging all show the same home.
//  • One blue EV reused in both charging scenes.

const WHITE = '#FFFFFF';
const BLUE_LIGHT = '#CFE0FB';
const PANEL = '#3E8DF5';
const SLATE = '#3B4A63';
const SLATE_LIGHT = '#94A3B8';
const GREEN = '#34B16B';
const SUN_RAY = '#FFC83D';
const INK = '#3B4A63';
const CAR = '#1B6FD6';

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

/** `tone` is neutral grey everywhere except the off-peak pair, which keeps a
 *  blue day sky / navy night sky because the choice IS day vs night. */
function Frame({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'day' | 'night' }) {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="100%" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sv-sky-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1B6FD6" />
          <stop offset="1" stopColor="#5CC3F8" />
        </linearGradient>
        <linearGradient id="sv-sky-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B2E50" />
          <stop offset="1" stopColor="#2A6288" />
        </linearGradient>
        <linearGradient id="sv-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D6DDE8" />
          <stop offset="1" stopColor="#F0F3F8" />
        </linearGradient>
        {/* userSpaceOnUse so every shape of one cloud shares a single gradient */}
        <linearGradient id="sv-cloud" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="38">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#B6C8E0" />
        </linearGradient>
        <linearGradient id="sv-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFD60A" />
          <stop offset="1" stopColor="#FFB800" />
        </linearGradient>
        <linearGradient id="sv-tree" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7BD88F" />
          <stop offset="1" stopColor="#2FA760" />
        </linearGradient>
      </defs>
      <rect width="120" height="80" fill={tone === 'day' ? 'url(#sv-sky-day)' : tone === 'night' ? 'url(#sv-sky-night)' : 'url(#sv-bg)'} />
      {children}
    </svg>
  );
}

// ─── Shared building blocks ─────────────────────────────────────────────────

function Ground({ y = 64 }: { y?: number }) {
  return <rect y={y} width="120" height={80 - y} fill="#B9C5D8" opacity="0.4" />;
}

/** The house. Drawn on the full 120×80 canvas; `top` / `bottom` are the
 *  panel counts in the upper / lower roof row. Wrap in a transform to scale. */
function House({ top = 2, bottom = 4 }: { top?: number; bottom?: number }) {
  const pitch = 12;
  const row = (count: number, y: number) =>
    Array.from({ length: count }).map((_, i) => (
      <rect key={`${y}-${i}`} x={60 - (count * pitch - 2) / 2 + i * pitch} y={y} width="10" height="9" rx="2" fill={PANEL} />
    ));
  return (
    <g>
      <path d="M12 46L34 16H86L108 46Z" fill={SLATE} stroke={SLATE} strokeWidth="3" strokeLinejoin="round" />
      {row(top, 19)}
      {row(bottom, 31)}
      <rect x="22" y="46" width="76" height="22" rx="3" fill={WHITE} />
      <rect x="31" y="53" width="12" height="8" rx="2" fill={BLUE_LIGHT} />
      <rect x="77" y="53" width="12" height="8" rx="2" fill={BLUE_LIGHT} />
      <rect x="54" y="52" width="12" height="16" rx="2" fill={BLUE_LIGHT} />
    </g>
  );
}

/** Same house, scaled so its base sits on `baseY` and its centre on `cx`. */
function PlacedHouse({ cx, baseY, s }: { cx: number; baseY: number; s: number }) {
  return (
    <g transform={`translate(${cx - 60 * s} ${baseY - 68 * s}) scale(${s})`}>
      <House />
    </g>
  );
}

/** Apple-style cloud: three round puffs on a flat base, white → pale blue. */
function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="url(#sv-cloud)">
      <circle cx="14" cy="28" r="10" />
      <circle cx="30" cy="18" r="15" />
      <circle cx="48" cy="26" r="12" />
      <rect x="14" y="26" width="34" height="12" />
    </g>
  );
}

function Sun({ x, y, r, rays = true }: { x: number; y: number; r: number; rays?: boolean }) {
  return (
    <g>
      {rays &&
        [0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <rect key={a} x={x - 1.4} y={y - r - 7} width="2.8" height="5" rx="1.4" fill={SUN_RAY} transform={`rotate(${a} ${x} ${y})`} />
        ))}
      <circle cx={x} cy={y} r={r} fill="url(#sv-sun)" />
    </g>
  );
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1.7" y="9" width="3.4" height="10" rx="1.4" fill={SLATE} />
      <circle cx="0" cy="5" r="10" fill="url(#sv-tree)" />
    </g>
  );
}

/** Side-view EV facing right, in brand blue. Origin = top-left; 34×15. */
function Car({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M1 11V8.6Q1 7 2.8 6.6L8 5.2Q10 1.5 14 1.5H21Q24 1.5 26 5L30 6.2Q33 6.8 33 9V11Q33 12 32 12H2Q1 12 1 11Z" fill={CAR} />
      <path d="M10.2 5Q11.5 3.1 14 3.1H16.2V5Z" fill="#CFE0FB" />
      <path d="M17.6 3.1H21Q22.6 3.1 23.7 5H17.6Z" fill="#CFE0FB" />
      <circle cx="9.5" cy="12" r="3.2" fill={SLATE} />
      <circle cx="9.5" cy="12" r="1.2" fill={BLUE_LIGHT} />
      <circle cx="25" cy="12" r="3.2" fill={SLATE} />
      <circle cx="25" cy="12" r="1.2" fill={BLUE_LIGHT} />
    </g>
  );
}

// ─── Roof size ──────────────────────────────────────────────────────────────

function RoofArt({ top, bottom }: { top: number; bottom: number }) {
  return (
    <Frame>
      <Ground />
      <House top={top} bottom={bottom} />
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
      <circle cx="60" cy="40" r="28.5" fill="none" stroke={BLUE_LIGHT} strokeWidth="2" />
      {letters.map(({ l, x, y, d }) => (
        <text key={l} x={x} y={y} fontSize="9" fontWeight="800" textAnchor="middle" fill={d === dir ? '#1B6FD6' : SLATE_LIGHT}>
          {l}
        </text>
      ))}
      <g transform={`rotate(${angle} 60 40)`}>
        <path d="M60 29L65 40H55Z" fill="#1B6FD6" stroke="#1B6FD6" strokeWidth="2" strokeLinejoin="round" />
        <path d="M60 51L65 40H55Z" fill={BLUE_LIGHT} stroke={BLUE_LIGHT} strokeWidth="2" strokeLinejoin="round" />
      </g>
      <circle cx="60" cy="40" r="3" fill={WHITE} />
      <circle cx="60" cy="40" r="1.6" fill={SLATE} />
    </Frame>
  );
}

// ─── Shade: the same house, three skies ─────────────────────────────────────

function ShadeArt({ level }: { level: 'none' | 'partial' | 'heavy' }) {
  return (
    <Frame>
      <Ground y={66} />
      {level === 'none' && <Sun x={94} y={20} r={9} />}
      {level === 'partial' && (
        <>
          <Sun x={92} y={19} r={10} rays={false} />
          <Cloud x={64} y={8} s={0.62} />
        </>
      )}
      {level === 'heavy' && (
        <>
          <Cloud x={8} y={3} s={0.7} />
          <Cloud x={60} y={0} s={0.82} />
        </>
      )}
      <PlacedHouse cx={60} baseY={70} s={0.8} />
      {level === 'heavy' && (
        <>
          <Tree x={16} y={46} s={1.2} />
          <Tree x={104} y={46} s={1.2} />
          <Tree x={31} y={52} s={0.95} />
          <Tree x={89} y={52} s={0.95} />
        </>
      )}
    </Frame>
  );
}

// ─── Install price ──────────────────────────────────────────────────────────

function DollarArt({ n }: { n: 1 | 2 | 3 }) {
  return (
    <Frame>
      <text x="60" y="54" fontSize={n === 1 ? 44 : n === 2 ? 38 : 32} fontWeight="800" textAnchor="middle" fill={INK} letterSpacing="1">
        {'$'.repeat(n)}
      </text>
    </Frame>
  );
}

// ─── Charging ───────────────────────────────────────────────────────────────

function HomeChargeArt() {
  return (
    <Frame>
      <Ground />
      <PlacedHouse cx={34} baseY={66} s={0.62} />
      <rect x="58.5" y="52" width="6" height="11" rx="2" fill={GREEN} />
      <path d="M64.5 57.5Q71 57.5 74 62" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <Car x={74} y={52} s={1.05} />
    </Frame>
  );
}

function PublicChargeArt() {
  return (
    <Frame>
      <Ground />
      <rect x="16" y="16" width="24" height="48" rx="5" fill={WHITE} />
      <rect x="21" y="21" width="14" height="14" rx="3" fill={GREEN} />
      <path d="M29 22.5L25.5 29h3l-1.2 5.5 5-7h-3.2l1.4-5z" fill={WHITE} />
      <rect x="22" y="43" width="12" height="3" rx="1.5" fill={BLUE_LIGHT} />
      <path d="M40 48Q56 48 58 60" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <Car x={66} y={52} s={1.05} />
    </Frame>
  );
}

// ─── Off-peak ───────────────────────────────────────────────────────────────

function Sparkle({ x, y, s }: { x: number; y: number; s: number }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0-4Q.6-.6 4 0Q.6.6 0 4Q-.6.6-4 0Q-.6-.6 0-4Z" fill={WHITE} />;
}

function OffPeakArt({ night }: { night: boolean }) {
  return night ? (
    <Frame tone="night">
      <path d="M70 17a23 23 0 1 0 15 40A18 18 0 0 1 70 17z" fill="#FFF3C4" />
      <Sparkle x={34} y={24} s={2.4} />
      <Sparkle x={100} y={26} s={1.6} />
      <Sparkle x={26} y={54} s={1.5} />
      <Sparkle x={96} y={58} s={1.8} />
    </Frame>
  ) : (
    <Frame tone="day">
      <Sun x={60} y={40} r={15} />
    </Frame>
  );
}

// ─── Generic ────────────────────────────────────────────────────────────────

/** Pencil only — the same icon on every "Custom" card. */
function CustomArt() {
  return (
    <Frame>
      <g transform="rotate(40 60 40)">
        <rect x="52" y="6" width="16" height="9" rx="3.5" fill="#FF8FA3" />
        <rect x="52" y="14" width="16" height="6" fill={BLUE_LIGHT} />
        <rect x="52" y="20" width="16" height="30" fill="#FFD60A" />
        <rect x="56.5" y="20" width="2" height="30" fill="#FFB800" />
        <path d="M52 50h16l-8 14z" fill="#FFE0B8" />
        <path d="M57 59.5h6L60 65z" fill={SLATE} />
      </g>
    </Frame>
  );
}

function UnknownArt() {
  return (
    <Frame>
      <circle cx="60" cy="40" r="22" fill={WHITE} />
      <text x="60" y="51" fontSize="30" fontWeight="800" textAnchor="middle" fill={INK}>?</text>
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
