// Inline SVG illustrations for the survey option cards. Each is drawn on a
// 120x80 canvas with the same small palette so the cards feel like one set.

const BLUE = '#186CDD';
const BLUE_LIGHT = '#DBE7FE';
const SKY = '#EAF3FF';
const SUN = '#F5B83D';
const GREEN = '#2E9E5B';
const GREEN_DARK = '#1F7A43';
const WALL = '#FFFFFF';
const LINE = '#C9D3E6';
const INK = '#1E232E';
const GRAY = '#E1E5EF';

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

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="100%" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      {children}
    </svg>
  );
}

/** A house front with a panel grid on the roof. `rows` x `cols` panels. */
function RoofArt({ cols, rows }: { cols: number; rows: number }) {
  const roofTop = 12;
  const roofBottom = 44;
  const panels = [];
  const gridW = cols * 9;
  const startX = 60 - gridW / 2;
  const panelH = Math.min(9, (roofBottom - roofTop - 6) / rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      panels.push(
        <rect
          key={`${r}-${c}`}
          x={startX + c * 9 + 0.8}
          y={roofTop + 4 + r * (panelH + 1)}
          width={7.4}
          height={panelH}
          rx={1}
          fill={BLUE}
          opacity={0.92}
        />,
      );
    }
  }
  return (
    <Frame>
      <rect x="0" y="0" width="120" height="80" rx="8" fill={SKY} />
      <polygon points={`10,${roofBottom} 60,${roofTop - 4} 110,${roofBottom}`} fill="#8A93A6" />
      <polygon points={`14,${roofBottom} 60,${roofTop} 106,${roofBottom}`} fill="#B7BFCF" />
      {panels}
      <rect x="22" y={roofBottom} width="76" height="28" fill={WALL} stroke={LINE} />
      <rect x="54" y="54" width="12" height="18" rx="1.5" fill={BLUE_LIGHT} stroke={LINE} />
      <rect x="30" y="54" width="14" height="10" rx="1.5" fill={BLUE_LIGHT} stroke={LINE} />
      <rect x="76" y="54" width="14" height="10" rx="1.5" fill={BLUE_LIGHT} stroke={LINE} />
      <rect x="0" y="72" width="120" height="8" fill="#CFE8D6" />
    </Frame>
  );
}

/** Compass dial with the roof-facing direction highlighted and a sun at south. */
function DirArt({ dir }: { dir: 'north' | 'east' | 'south' | 'west' }) {
  const angle = { north: 0, east: 90, south: 180, west: 270 }[dir];
  const labelProps = { fontSize: 8, fontWeight: 700, textAnchor: 'middle' as const, fill: '#8A93A6' };
  return (
    <Frame>
      <rect x="0" y="0" width="120" height="80" rx="8" fill={SKY} />
      <circle cx="60" cy="40" r="29" fill={WALL} stroke={LINE} strokeWidth="1.5" />
      <text x="60" y="17" {...labelProps}>N</text>
      <text x="60" y="68" {...labelProps}>S</text>
      <text x="94" y="43" {...labelProps}>E</text>
      <text x="26" y="43" {...labelProps}>W</text>
      <g transform={`rotate(${angle} 60 40)`}>
        <polygon points="60,16 54,40 66,40" fill={BLUE} />
        <polygon points="60,64 54,40 66,40" fill={GRAY} />
      </g>
      <circle cx="60" cy="40" r="3.2" fill={INK} />
      {dir === 'south' && <circle cx="102" cy="14" r="7" fill={SUN} />}
    </Frame>
  );
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1.5" y="10" width="3" height="10" fill="#8B6B4A" />
      <circle cx="0" cy="6" r="10" fill={GREEN} />
      <circle cx="-5" cy="10" r="6" fill={GREEN_DARK} opacity="0.5" />
    </g>
  );
}

function ShadeArt({ level }: { level: 'none' | 'partial' | 'heavy' }) {
  return (
    <Frame>
      <rect x="0" y="0" width="120" height="80" rx="8" fill={level === 'heavy' ? '#DDE5F0' : SKY} />
      {level !== 'heavy' && <circle cx="98" cy="16" r="9" fill={SUN} />}
      {level === 'none' && (
        <g stroke={SUN} strokeWidth="2" strokeLinecap="round">
          <line x1="98" y1="2" x2="98" y2="4" />
          <line x1="110" y1="16" x2="112" y2="16" />
          <line x1="86" y1="16" x2="84" y2="16" />
          <line x1="106" y1="8" x2="108" y2="6" />
          <line x1="90" y1="8" x2="88" y2="6" />
        </g>
      )}
      <polygon points="30,42 60,20 90,42" fill="#B7BFCF" />
      <rect x="36" y="42" width="48" height="28" fill={WALL} stroke={LINE} />
      <rect x="51" y="30" width="18" height="9" rx="1" fill={BLUE} opacity={level === 'heavy' ? 0.45 : 0.92} />
      <rect x="0" y="70" width="120" height="10" fill="#CFE8D6" />
      {level === 'partial' && (
        <>
          <Tree x={16} y={46} s={1.05} />
          <ellipse cx="82" cy="22" rx="12" ry="5" fill="#FFFFFF" opacity="0.9" />
        </>
      )}
      {level === 'heavy' && (
        <>
          <Tree x={14} y={40} s={1.35} />
          <Tree x={104} y={42} s={1.3} />
          <Tree x={34} y={34} s={1.2} />
          <Tree x={86} y={36} s={1.2} />
          <ellipse cx="60" cy="14" rx="26" ry="8" fill="#FFFFFF" opacity="0.85" />
        </>
      )}
    </Frame>
  );
}

/** Just a row of dollar signs — the more $, the pricier the install. */
function DollarArt({ n }: { n: 1 | 2 | 3 }) {
  return (
    <Frame>
      <rect x="0" y="0" width="120" height="80" rx="8" fill="#FFF6E0" />
      <text x="60" y="53" fontSize={n === 1 ? 40 : n === 2 ? 36 : 30} fontWeight="800" textAnchor="middle" fill={SUN} letterSpacing="2">
        {'$'.repeat(n)}
      </text>
    </Frame>
  );
}

function Car({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 10l4-8h14l5 8h5v6H-3v-6z" fill={BLUE} />
      <rect x="5" y="3.5" width="5" height="5" rx="1" fill={BLUE_LIGHT} />
      <rect x="11.5" y="3.5" width="5" height="5" rx="1" fill={BLUE_LIGHT} />
      <circle cx="4" cy="16" r="3" fill={INK} />
      <circle cx="19" cy="16" r="3" fill={INK} />
    </g>
  );
}

function HomeChargeArt() {
  return (
    <Frame>
      <rect x="0" y="0" width="120" height="80" rx="8" fill={SKY} />
      <polygon points="14,40 44,16 74,40" fill="#B7BFCF" />
      <rect x="20" y="40" width="48" height="28" fill={WALL} stroke={LINE} />
      <rect x="40" y="50" width="12" height="18" rx="1.5" fill={BLUE_LIGHT} stroke={LINE} />
      <rect x="66" y="48" width="8" height="12" rx="2" fill={GREEN} />
      <path d="M70 60c10 2 14 6 16 12" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <Car x={84} y={50} />
      <rect x="0" y="70" width="120" height="10" fill="#CFE8D6" />
    </Frame>
  );
}

function PublicChargeArt() {
  return (
    <Frame>
      <rect x="0" y="0" width="120" height="80" rx="8" fill={SKY} />
      <rect x="22" y="14" width="22" height="46" rx="4" fill={WALL} stroke={GREEN} strokeWidth="2.5" />
      <rect x="27" y="20" width="12" height="10" rx="1.5" fill="#D7F0E0" />
      <path d="M34 36l-4 8h4l-2 7 6-9h-4l2-6z" fill={GREEN} />
      <path d="M44 40c14 0 12 18 26 18" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <Car x={72} y={46} />
      <rect x="0" y="66" width="120" height="14" fill="#5B6578" />
    </Frame>
  );
}

function OffPeakArt({ yes }: { yes: boolean }) {
  return (
    <Frame>
      <rect x="0" y="0" width="120" height="80" rx="8" fill={yes ? '#1F2A44' : SKY} />
      {yes ? (
        <>
          <path d="M72 18a20 20 0 1013 36 16 16 0 01-13-36z" fill="#FFE9A8" />
          <circle cx="30" cy="20" r="1.8" fill="#FFFFFF" />
          <circle cx="46" cy="12" r="1.4" fill="#FFFFFF" />
          <circle cx="24" cy="44" r="1.4" fill="#FFFFFF" />
          <circle cx="98" cy="22" r="1.4" fill="#FFFFFF" />
          <text x="60" y="72" fontSize="9" fontWeight="700" textAnchor="middle" fill="#FFE9A8">12 AM – 6 AM</text>
        </>
      ) : (
        <>
          <circle cx="60" cy="34" r="16" fill={SUN} />
          <g stroke={SUN} strokeWidth="3" strokeLinecap="round">
            <line x1="60" y1="8" x2="60" y2="12" />
            <line x1="60" y1="56" x2="60" y2="60" />
            <line x1="34" y1="34" x2="38" y2="34" />
            <line x1="82" y1="34" x2="86" y2="34" />
          </g>
          <text x="60" y="74" fontSize="9" fontWeight="700" textAnchor="middle" fill="#8A93A6">My own hours</text>
        </>
      )}
    </Frame>
  );
}

function CustomArt() {
  return (
    <Frame>
      <rect x="0" y="0" width="120" height="80" rx="8" fill="#F1ECFF" />
      <rect x="22" y="28" width="62" height="22" rx="4" fill={WALL} stroke="#8B6CF0" strokeWidth="2" />
      <line x1="30" y1="39" x2="52" y2="39" stroke="#C9BDF7" strokeWidth="3" strokeLinecap="round" />
      <rect x="55" y="33" width="2" height="12" fill="#8B6CF0" />
      <path d="M84 56l20-20 6 6-20 20-9 3z" fill="#8B6CF0" />
      <path d="M100 40l6 6" stroke="#FFFFFF" strokeWidth="2" />
    </Frame>
  );
}

function UnknownArt() {
  return (
    <Frame>
      <rect x="0" y="0" width="120" height="80" rx="8" fill="#F4F6FA" />
      <circle cx="60" cy="40" r="20" fill={WALL} stroke={LINE} strokeWidth="2" />
      <text x="60" y="50" fontSize="26" fontWeight="800" textAnchor="middle" fill="#8A93A6">?</text>
    </Frame>
  );
}

export function Art({ name }: { name: ArtName }) {
  switch (name) {
    case 'roof-small': return <RoofArt cols={3} rows={1} />;
    case 'roof-medium': return <RoofArt cols={5} rows={2} />;
    case 'roof-large': return <RoofArt cols={7} rows={3} />;
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
    case 'offpeak-yes': return <OffPeakArt yes />;
    case 'offpeak-no': return <OffPeakArt yes={false} />;
    case 'custom': return <CustomArt />;
    case 'unknown': return <UnknownArt />;
  }
}
