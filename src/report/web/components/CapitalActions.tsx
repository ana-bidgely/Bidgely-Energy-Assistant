import type { CapitalActionsSection, CapitalActionCard } from '../../types';
import { HeatingFlame1Icon, HeatingFlame2Icon, HeatingFlame3Icon, HeatingBaseIcon, PoolPumpIcon, BarIncreaseIcon } from './icons/OptimizerIcons';

interface Props {
  section: CapitalActionsSection;
}

// Composite flame + base icon at 32px — same glyph as EfficiencyDeepDive's
// HeatingIcon, scaled up from the 24px source insets by 4/3.
function HeatingIcon32() {
  return (
    <span className="relative w-8 h-8 shrink-0">
      <HeatingFlame1Icon className="absolute" style={{ top: 3.75, left: 18.61, width: 2.83, height: 5.91 }} />
      <HeatingFlame2Icon className="absolute" style={{ top: 3.75, left: 14.41, width: 2.83, height: 5.91 }} />
      <HeatingFlame3Icon className="absolute" style={{ top: 3.75, left: 10.21, width: 2.83, height: 5.91 }} />
      <HeatingBaseIcon className="absolute" style={{ top: 10.03, left: 2, width: 28, height: 19.97 }} />
    </span>
  );
}

function CapitalIcon({ kind }: { kind: CapitalActionCard['icon'] }) {
  switch (kind) {
    case 'thermometer':
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 19.5V7a2 2 0 00-4 0v12.5a4.5 4.5 0 104 0z" />
          <path d="M16 11h2M16 14h2M16 17h2" />
        </svg>
      );
    case 'pool-pump':
      return <PoolPumpIcon className="w-8 h-8" />;
    case 'heating':
      return <HeatingIcon32 />;
    case 'solar':
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="16" cy="16" r="6" />
          <path d="M16 3v3M16 26v3M3 16h3M26 16h3M6.5 6.5l2 2M23.5 23.5l2 2M6.5 25.5l2-2M23.5 8.5l2-2" />
        </svg>
      );
  }
}

function StatTile({ label, value, tone }: { label: string; value: string; tone?: 'default' | 'savings' }) {
  const isSavings = tone === 'savings';
  return (
    <div
      className="flex-1 min-w-0 rounded-[8px] p-6 flex flex-col gap-0.5"
      style={{ backgroundColor: isSavings ? '#CEF3DA' : '#F5F5F5' }}
    >
      <span className="text-[12px] leading-[16px]" style={{ color: isSavings ? '#14843C' : '#66758D' }}>
        {label}
      </span>
      <span className="text-[14px] leading-[20px] font-semibold" style={{ color: isSavings ? '#14843C' : '#000000' }}>
        {value}
      </span>
    </div>
  );
}

function CapitalItem({ card }: { card: CapitalActionCard }) {
  return (
    <div className="flex gap-4 items-start w-full">
      <div className="w-8 h-8 flex items-center justify-center text-[#262E40] shrink-0">
        <CapitalIcon kind={card.icon} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-[18px] leading-[26px] font-semibold text-black m-0">{card.title}</h3>
          <p className="text-[14px] leading-[20px] text-black m-0">{card.description}</p>
        </div>
        <div className="flex gap-4 w-full">
          {card.stats.map((stat, i) => (
            <StatTile key={i} label={stat.label} value={stat.value} tone={stat.tone} />
          ))}
        </div>
        {card.footnote && (
          <p className="text-[12px] leading-[16px] italic text-black m-0">{card.footnote}</p>
        )}
        {card.ctaLabel && (
          <a
            href={card.ctaUrl ?? '#'}
            className="w-full text-center border border-black rounded-[8px] px-4 py-2 text-[14px] leading-[20px] text-black"
          >
            {card.ctaLabel}
          </a>
        )}
      </div>
    </div>
  );
}

// CapitalActions — "Capital Investments" section (Home Optimizer V2). White
// bordered card: icon + big title + description header, then a vertical
// stack of upgrade items separated by hairlines.
export function CapitalActions({ section }: Props) {
  return (
    <div className="bg-white border border-[#F7F7F7] rounded-[14px] p-8 flex flex-col gap-10 w-full">
      <div className="flex flex-col gap-2">
        <BarIncreaseIcon className="w-12 h-12" />
        <h2 className="text-[24px] leading-[28px] font-bold text-black m-0">{section.label}</h2>
        <p className="text-[14px] leading-[20px] text-[#262E40] m-0">{section.description}</p>
      </div>

      <div className="flex flex-col w-full">
        {section.cards.map((card, i) => (
          <div key={i} className={i > 0 ? 'border-t border-[#EFEFEF] mt-10 pt-10' : ''}>
            <CapitalItem card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}
