import type { EfficiencyDeepDiveSection, EfficiencyCategory, EfficiencyBlock } from '../../types';
import {
  HeatingFlame1Icon, HeatingFlame2Icon, HeatingFlame3Icon, HeatingBaseIcon,
  CoolingIcon, AlwaysOnIcon, PoolPumpIcon, WaterHeatingIcon,
  SetpointThumbIcon, WarnTriangleIcon, ArrowUpRightIcon, FlagIcon, LeafIcon,
  TodNightIcon, TodMorningIcon, TodAfternoonIcon, TodEveningIcon,
} from './icons/OptimizerIcons';

interface Props {
  section: EfficiencyDeepDiveSection;
}

const CATEGORY_ICON: Record<Exclude<EfficiencyCategory['icon'], 'heating'>, typeof LeafIcon> = {
  cooling: CoolingIcon,
  'always-on': AlwaysOnIcon,
  'pool-pump': PoolPumpIcon,
  'water-heating': WaterHeatingIcon,
};

const TOD_ICON: Record<'tod_night' | 'tod_morning' | 'tod_afternoon' | 'tod_evening', typeof LeafIcon> = {
  tod_night: TodNightIcon,
  tod_morning: TodMorningIcon,
  tod_afternoon: TodAfternoonIcon,
  tod_evening: TodEveningIcon,
};

// Composite flame + base icon — identical inset math to the HBA report's
// heating icon (same source glyph, ported verbatim from the design export).
function HeatingIcon() {
  return (
    <span className="relative w-6 h-6 shrink-0">
      <HeatingFlame1Icon className="absolute" style={{ top: 2.81, left: 13.96, width: 2.12, height: 4.43 }} />
      <HeatingFlame2Icon className="absolute" style={{ top: 2.81, left: 10.81, width: 2.12, height: 4.43 }} />
      <HeatingFlame3Icon className="absolute" style={{ top: 2.81, left: 7.66, width: 2.12, height: 4.43 }} />
      <HeatingBaseIcon className="absolute" style={{ top: 7.52, left: 1.5, width: 21, height: 14.98 }} />
    </span>
  );
}

// HourlyChart — the usage-by-hour line chart shared by Cooling/Heating,
// with the exact reference curve path (only the stroke color differs).
function HourlyChart({ color }: { color: string }) {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-lg p-[25px] flex flex-col w-full">
      <div className="flex gap-6 items-start">
        <div className="flex gap-3 items-center w-[71px] shrink-0" style={{ height: 156 }}>
          <span
            className="text-[12px] text-[#262E40] whitespace-nowrap flex items-center justify-center"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 156 }}
          >
            Hourly Usage Distribution
          </span>
          <div className="flex flex-col justify-between pt-4" style={{ height: 156 }}>
            {['100%', '80%', '60%', '40%', '20%', '0%'].map((l) => (
              <span key={l} className="text-[12px] leading-[16px] text-[#262E40]">{l}</span>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <svg viewBox="0 0 616 186" width="100%" height="186" style={{ display: 'block' }}>
            <line x1="0" y1="0" x2="616" y2="0" stroke="#EFEFEF" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="31" x2="616" y2="31" stroke="#EFEFEF" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="62" x2="616" y2="62" stroke="#EFEFEF" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="93" x2="616" y2="93" stroke="#EFEFEF" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="124" x2="616" y2="124" stroke="#EFEFEF" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="155" x2="616" y2="155" stroke="#DFDFE0" strokeWidth="1" />
            <path
              d="M0,150 C40,145 60,80 105,70 C150,60 160,120 210,140 C260,158 300,163 340,150 C400,130 420,45 470,35 C520,25 560,45 616,50"
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      <div className="flex justify-between pt-4 pl-[95px] text-[12px] text-[#262E40]">
        <span>12 AM</span><span>4 AM</span><span>8 AM</span><span>12 PM</span><span>4 PM</span><span>8 PM</span><span>12 AM</span>
      </div>
      <div className="flex justify-between pt-4 px-2 pl-[95px] mt-8">
        {(
          [
            { icon: 'tod_night', label: 'Night', w: 18 },
            { icon: 'tod_morning', label: 'Morning', w: 22 },
            { icon: 'tod_afternoon', label: 'Afternoon', w: 22 },
            { icon: 'tod_evening', label: 'Evening', w: 20 },
            { icon: 'tod_night', label: 'Night', w: 18 },
          ] as const
        ).map((t, i) => {
          const TodIcon = TOD_ICON[t.icon];
          return (
            <div key={i} className="flex flex-col gap-1 items-center">
              <TodIcon style={{ width: t.w, height: t.w === 20 ? 16 : t.w }} />
              <span className="text-[12px] text-[#191C1E]">{t.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Callout({ block }: { block: Extract<EfficiencyBlock, { kind: 'callout' }> }) {
  return (
    <div className="bg-[#CEF3DA] rounded-lg py-5 px-6 flex gap-6 items-center">
      <div className="flex-1 flex flex-col gap-1">
        <p className="text-[14px] font-semibold text-[#000000] m-0">{block.title}</p>
        <p className="text-[14px] leading-[20px] text-[#000000] m-0">{block.description}</p>
      </div>
      <span className="text-[16px] leading-[24px] font-semibold text-[#14843C] whitespace-nowrap">{block.amount}</span>
    </div>
  );
}

function Setpoint({ block }: { block: Extract<EfficiencyBlock, { kind: 'setpoint' }> }) {
  const leftPct = block.thumbPct * 100;
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[20px] leading-[24px] font-semibold text-[#000000] m-0">{block.title}</p>
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex justify-between text-[12px] font-semibold">
          <span className="text-[#3794FC]">{block.lowerLabel}</span>
          <span className="text-[#FF6400]">{block.higherLabel}</span>
        </div>
        <div
          className="h-9 rounded-full relative"
          style={{
            background:
              'linear-gradient(90deg, rgb(55,148,252) 0%, rgb(100,210,200) 25%, rgb(120,220,150) 35%, rgb(140,230,120) 46.5%, rgb(200,230,100) 58%, rgb(255,200,60) 72%, rgb(255,80,0) 100%)',
          }}
        >
          <div className="absolute w-[46px] h-[46px] -top-[5px]" style={{ left: `calc(${leftPct}% - 23px)` }}>
            <SetpointThumbIcon className="w-full h-full" />
          </div>
        </div>
        <div className="relative" style={{ height: 39 }}>
          <div className="absolute w-0.5 h-4 bg-[#125AAA] top-0" style={{ left: `calc(${leftPct}% + 1px)` }} />
          <div
            className="absolute top-4 bg-[#125AAA] text-white rounded-md px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
            style={{ left: `calc(${leftPct}% - 22px)` }}
          >
            Your setting
          </div>
        </div>
      </div>
      <Callout block={block.callout} />
    </div>
  );
}

function Saturation({ block }: { block: Extract<EfficiencyBlock, { kind: 'saturation' }> }) {
  return (
    <>
      <p className="text-[20px] leading-[24px] text-[#000000] py-4 m-0">{block.subtitle}</p>
      <div className="bg-[#FCE7E5] rounded-lg p-5 flex flex-col gap-5">
        <div className="flex gap-3.5 items-center">
          <div className="flex-1 flex flex-col gap-2">
            <WarnTriangleIcon className="w-6 h-6" />
            <h4 className="text-[14px] font-semibold text-[#000000] m-0">{block.title}</h4>
            <p className="text-[14px] leading-[20px] text-[#000000] m-0">{block.description}</p>
          </div>
          <div className="w-[317px] shrink-0 self-stretch bg-white rounded-md overflow-hidden flex items-center">
            <img src={block.chartImage} alt="" className="w-full block" />
          </div>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#000000] mb-2 mt-0">Common Causes</p>
          <div className="flex flex-wrap gap-2">
            {block.causes.map((c) => (
              <span key={c} className="bg-white border border-[#DFDFE0] rounded-lg px-3 py-1 text-[14px] leading-[20px] text-[#000000]">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function CtaTechnician({ block }: { block: Extract<EfficiencyBlock, { kind: 'cta-technician' }> }) {
  return (
    <div className="bg-[#CEF3DA] rounded-lg py-5 px-6 flex gap-4">
      <div className="flex-1 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <p className="text-[14px] font-semibold text-[#000000] m-0">{block.title}</p>
          <p className="text-[14px] leading-[20px] text-[#000000] m-0">{block.description}</p>
        </div>
        <span className="text-[15px] font-medium text-[#0E4895] underline w-fit">{block.linkLabel}</span>
      </div>
      <span className="flex items-center justify-center text-[16px] font-semibold text-[#14843C] whitespace-nowrap">
        {block.savingsLabel}
      </span>
    </div>
  );
}

function BarCompare({ block }: { block: Extract<EfficiencyBlock, { kind: 'bar-compare' }> }) {
  return (
    <div className="flex flex-col gap-3">
      {block.rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-3">
          <span className="text-[12px] font-semibold text-[#262E40] w-[131px] shrink-0">{row.label}</span>
          <div
            className={`h-9 rounded-md flex-1 overflow-hidden relative ${row.tone === 'green' ? 'bg-[#F0F8F4]' : 'bg-[#FCF0E6]'}`}
          >
            <div
              className={`h-9 rounded-md flex items-center justify-end pr-3 ${row.tone === 'green' ? 'bg-[#7FECCB]' : 'bg-[#FF9624]'}`}
              style={{ width: `${row.widthPct * 100}%` }}
            >
              <span className="text-[13px] font-semibold text-[#262E40] whitespace-nowrap">{row.displayValue}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Chips({ block }: { block: Extract<EfficiencyBlock, { kind: 'chips' }> }) {
  return (
    <div className="flex flex-col gap-3">
      {block.title && <p className="text-[14px] font-semibold text-[#000000] m-0">{block.title}</p>}
      <div className="flex flex-wrap gap-2">
        {block.items.map((c) => (
          <span key={c} className="bg-white border border-[#DFDFE0] rounded-lg px-3 py-1 text-[14px] leading-[20px] text-[#000000]">
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function GreenList({ block }: { block: Extract<EfficiencyBlock, { kind: 'green-list' }> }) {
  return (
    <div className="bg-[#CEF3DA] rounded-lg flex flex-col">
      <div className="px-6 pt-5 pb-2 flex flex-col gap-4">
        <div className="flex gap-4 items-start">
          <div className="flex-1 flex flex-col gap-1">
            <p className="text-[14px] font-semibold text-[#000000] m-0">{block.title}</p>
            {block.description && <p className="text-[14px] leading-[20px] text-[#000000] m-0">{block.description}</p>}
          </div>
          <span className="text-[16px] leading-[24px] font-semibold text-[#14843C] w-[149px] text-right shrink-0">
            {block.amount}
          </span>
        </div>
        <div className="h-px bg-black/10 w-full" />
      </div>
      {block.items.map((item, i) => (
        <div key={i} className="px-6 py-4 flex gap-4 items-center">
          {item.hasArrow && (
            <span className="w-6 h-6 shrink-0 rotate-90">
              <ArrowUpRightIcon className="w-6 h-6" />
            </span>
          )}
          <div className="flex-1 flex flex-col gap-1">
            <p className="text-[14px] font-semibold text-[#000000] m-0">{item.title}</p>
            <p className="text-[14px] leading-[20px] text-[#000000] m-0">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Divider() {
  return (
    <div className="h-10 flex items-center">
      <div className="w-full h-px bg-[#EFEFEF]" />
    </div>
  );
}

function Block({ block }: { block: EfficiencyBlock }) {
  switch (block.kind) {
    case 'hourly-chart':
      return <HourlyChart color={block.color} />;
    case 'callout':
      return <Callout block={block} />;
    case 'setpoint':
      return <Setpoint block={block} />;
    case 'saturation':
      return <Saturation block={block} />;
    case 'cta-technician':
      return <CtaTechnician block={block} />;
    case 'bar-compare':
      return <BarCompare block={block} />;
    case 'chips':
      return <Chips block={block} />;
    case 'green-list':
      return <GreenList block={block} />;
    case 'confirm-flag':
      return (
        <div className="flex gap-2 items-center py-2">
          <FlagIcon className="w-5 h-5" />
          <span className="text-[14px] text-[#000000] underline">{block.label}</span>
        </div>
      );
    default:
      return null;
  }
}

function Category({ category }: { category: EfficiencyCategory }) {
  return (
    <>
      <div className="flex gap-4 items-center py-6 pb-2">
        {(() => {
          if (category.icon === 'heating') return <HeatingIcon />;
          const CatIcon = CATEGORY_ICON[category.icon];
          return <CatIcon className="w-6 h-6 shrink-0" />;
        })()}
        <span className="text-[12px] leading-[16px] font-semibold text-[#262E40] uppercase whitespace-nowrap">{category.label}</span>
        <div className="flex-1 h-px bg-[#DFDFE0]" />
      </div>
      <p className="text-[20px] leading-[24px] text-[#000000] py-4 m-0">{category.subtitle}</p>
      {category.subtitleNote && (
        <p className="text-[14px] leading-[20px] text-[#262E40] mt-2 mb-0">{category.subtitleNote}</p>
      )}
      <div className="flex flex-col gap-4 mt-4">
        {category.blocks.map((block, i) =>
          block.kind === 'confirm-flag' || block.kind === 'chips' ? (
            <Block key={i} block={block} />
          ) : (
            <div key={i}>
              <Block block={block} />
            </div>
          )
        )}
      </div>
    </>
  );
}

// EfficiencyDeepDive — banner + a stack of appliance categories (Home
// Optimizer report's "Energy Efficiency" section).
export function EfficiencyDeepDive({ section }: Props) {
  return (
    <div className="bg-white border border-[#F7F7F7] rounded-[14px] p-8 flex flex-col w-full">
      <div className="flex flex-col gap-2 pr-[120px]">
        <LeafIcon className="w-12 h-12" />
        <h2 className="text-[24px] leading-[28px] font-bold text-[#000000] m-0">{section.bannerTitle}</h2>
        <p className="text-[14px] leading-[20px] text-[#262E40] m-0">{section.bannerDescription}</p>
      </div>
      {section.categories.map((category, i) => (
        <div key={i}>
          <Category category={category} />
          {i < section.categories.length - 1 && <Divider />}
        </div>
      ))}
    </div>
  );
}
