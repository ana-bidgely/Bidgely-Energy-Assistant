import type { RatePlanSection, RatePeriod, ExportRatePeriod } from '../../types';
import { RateUsageChartView } from './RateUsageChart';
import { LeafIcon, PriceTagIcon } from './icons/OptimizerIcons';

// Rate-period tier colors — flat fills:
//   $    → Web/Data/off_peak (#28C898) mint
//   $$   → Web/Data/mid_peak (#FFD362) amber
//   $$$  → Web/Data/on_peak  (#FA96A8) pink
//   flat → neutral gray (#9A9A9A) for non-TOU "all day" plans
const tierColors: Record<RatePeriod['tier'], string> = {
  '$': 'bg-[#28C898]',
  '$$': 'bg-[#FFD362]',
  '$$$': 'bg-[#FA96A8]',
  flat: 'bg-[#9A9A9A]',
};

// RateBar — outer container has fill = stroke = Web/Foreground/400 (#66758D)
// per Figma. The 1px gaps between segments expose the parent fill, and the
// 1px outer stroke wraps the whole pill.
function RateBar({ periods }: { periods: Array<RatePeriod | ExportRatePeriod> }) {
  return (
    <div className="flex gap-px h-[38px] rounded-[10px] overflow-hidden w-full bg-[#66758D] border border-[#66758D]">
      {periods.map((p, i) => {
        const isExport = 'rate' in p;
        const exportP = isExport ? (p as ExportRatePeriod) : null;
        // Tier-driven color is the primary path. Export segments now carry an
        // optional `tier` (per Figma 1476:9039 the export bar uses the same
        // off/mid/on-peak ramp as imports). isHighlight remains as a fallback
        // amber callout if no tier is provided.
        const tier = isExport ? exportP!.tier : (p as RatePeriod).tier;
        const colorClass = tier
          ? tierColors[tier]
          : isExport && exportP!.isHighlight
          ? 'bg-[#FFB84F]'
          : 'bg-[#DFDFE0]';

        return (
          <div
            key={i}
            className={`${colorClass} flex items-center justify-center`}
            style={{ flex: p.widthFr }}
          >
            <span className="text-[12px] leading-[16px] font-semibold text-[#000000]">
              {isExport ? exportP!.rate : tier}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TimeLabels({ periods }: { periods: Array<{ timeRange: string; widthFr: number }> }) {
  return (
    <div className="flex w-full">
      {periods.map((p, i) => (
        <div key={i} className="flex items-start justify-center" style={{ flex: p.widthFr }}>
          {/* Webapp/Label/XS/Bold (12/16 SemiBold). Standard plan label shows
              Foreground/500; recommended plan shows Foreground/700 — but since
              the labels are identical between import and export, we use the
              softer FG/500 (matches the standard card; the recommended card
              re-uses these tokens with the surrounding green surface). */}
          <span className="text-[12px] leading-[16px] font-semibold text-[#262E40] text-center">{p.timeRange}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  section: RatePlanSection;
}

// RatePlan — recommended card uses Web/Green/200 (#CEF3DA) surface (NOT Green/400)
// with a Green/600 solid pill for "RECOMMENDED". Standard card uses white with
// a subtle Web/Background/400 1px stroke (NO shadow). Non-recommended label
// is rendered as a flat gray pill (Web/Background/400 surface).
const HEADER_ICON: Record<'price-tag' | 'leaf', typeof LeafIcon> = {
  'price-tag': PriceTagIcon,
  leaf: LeafIcon,
};

export function RatePlan({ section }: Props) {
  const header = section.header;
  const HeaderIcon = header ? HEADER_ICON[header.icon] : null;
  const body = (
    <div className={`flex flex-col w-full ${header ? 'gap-6' : 'gap-4'}`}>
      {header && HeaderIcon && (
        <div className="flex flex-col gap-2 pr-[120px]">
          <HeaderIcon className="w-12 h-12" />
          <h2 className="text-[24px] leading-[28px] font-bold text-[#000000] m-0">{header.title}</h2>
          <p className="text-[14px] leading-[20px] text-[#262E40] m-0">{header.description}</p>
        </div>
      )}
      {/* Plan cards */}
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        {section.plans.map((plan) => (
          <div
            key={plan.title}
            className={`flex-1 min-w-0 rounded-[14px] p-8 flex flex-col gap-10 ${
              plan.isRecommended
                ? 'bg-[#CEF3DA]'
                : 'bg-white border border-[#F7F7F7]'
            }`}
          >
            {/* Header */}
            <div className="flex flex-col gap-4">
              {plan.isRecommended ? (
                <div className="inline-flex">
                  {/* Solid Web/Green/600 pill, white text, radius 10, padding 4/12 */}
                  <span className="text-[12px] leading-[16px] font-semibold text-white px-3 py-1 rounded-[10px] bg-[#14843C] uppercase">
                    {plan.label}
                  </span>
                </div>
              ) : (
                <div className="inline-flex">
                  {/* Web/Background/400 pill, Foreground/500 text, radius 10, padding 4/12 */}
                  <span className="text-[12px] leading-[16px] font-semibold text-[#262E40] px-3 py-1 rounded-[10px] bg-[#EFEFEF] uppercase">
                    {plan.label}
                  </span>
                </div>
              )}
              {/* Plan title — Webapp/H1 (24/28 Bold) Foreground/700 */}
              <span className="text-[24px] leading-[28px] font-bold text-[#000000]">
                {plan.title}
              </span>
              {/* Description — Webapp/Label/SS/Regular (14/20). Recommended uses
                  Foreground/700; standard uses Foreground/500. */}
              <p
                className={`text-[14px] leading-[20px] font-normal ${
                  plan.isRecommended ? 'text-[#000000]' : 'text-[#262E40]'
                }`}
              >
                {plan.description}
              </p>
            </div>

            {/* Import bar — usageChart (EV report's own chart style) takes
                priority; otherwise fall back to the standard import pill bar. */}
            {plan.usageChart ? (
              <RateUsageChartView chart={plan.usageChart} />
            ) : (
              <div className="flex flex-col gap-2">
                <span
                  className={`text-[12px] leading-[16px] font-semibold uppercase ${
                    plan.isRecommended ? 'text-[#000000]' : 'text-[#262E40]'
                  }`}
                >
                  IMPORT (YOU BUY FROM GRID)
                </span>
                <RateBar periods={plan.importPeriods} />
                <TimeLabels periods={plan.importPeriods} />
              </div>
            )}

            {/* Savings — divided by 1px Foreground/700 @ 10% opacity per Figma.
                Two render modes:
                  • costRows  — multi-row cost section (rate-plan report)
                                First row above the divider, subsequent rows
                                below. The deepest row carries the Display/LL
                                value; rows above use Webapp/H2-style values.
                  • annualSavings (legacy) — single Annual Savings row used by
                                solar + EV reports. */}
            <div className="flex flex-col border-t border-[rgba(0,0,0,0.1)]">
              {plan.costRows && plan.costRows.length > 0 ? (
                <div className="flex flex-col">
                  {plan.costRows.map((row, idx) => {
                    const isFirst = idx === 0;
                    // First row: 20/24 SemiBold black. Later rows (e.g.
                    // "shifted" cost): 28/32 Bold Green/600 — both the big
                    // value and its delta caption share that green.
                    const valueClass = isFirst
                      ? 'text-[20px] leading-[24px] font-semibold text-[#000000]'
                      : 'text-[28px] leading-[32px] font-bold text-[#14843C]';
                    return (
                      <div
                        key={row.label}
                        className={`flex items-start justify-between ${idx > 0 ? 'pt-3 border-t border-[rgba(0,0,0,0.1)]' : ''} pb-3`}
                        style={{ paddingTop: idx === 0 ? 24 : undefined }}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-[14px] leading-[20px] font-semibold text-[#000000] uppercase">
                            {row.label}
                          </span>
                          {row.subLabel && (
                            <span className="text-[12px] leading-[16px] font-normal text-[#262E40]">
                              {row.subLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={valueClass}>{row.value}</span>
                          {row.delta && (
                            <span className="text-[12px] leading-[16px] font-semibold text-[#14843C]">
                              {row.delta}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between pt-6 pb-2">
                  {/* Webapp/Label/SS/Bold (14/20 SemiBold) Foreground/700 */}
                  <span className="text-[14px] leading-[20px] font-semibold text-[#000000] uppercase">
                    ANNUAL SAVINGS
                  </span>
                  <div className="flex flex-col items-end">
                    {/* Webapp/Display/LL (28/32 Bold) Web/Success/600 (#015C1A) */}
                    <span className="text-[28px] leading-[32px] font-bold text-[#015C1A]">
                      {plan.annualSavings}
                    </span>
                    {plan.annualSavingsDelta && (
                      <span className="text-[12px] leading-[16px] font-semibold text-[#015C1A]">
                        {plan.annualSavingsDelta}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {plan.insight && (
                <div className="bg-white rounded-[10px] p-4 mt-2">
                  <p className="text-[14px] leading-[20px] font-normal text-[#262E40]">
                    {plan.insight}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Export card — only rendered when export periods are present
          (the solar report has it, the EV report omits it). */}
      {section.exportPeriods.length > 0 && (
        <div className="bg-white border border-[#F7F7F7] rounded-[14px] pb-8 pt-6 px-8 w-full">
          <div className="flex flex-col gap-6">
            {section.exportNote && (
              <span className="text-[12px] leading-[16px] font-semibold text-[#262E40] uppercase">
                {section.exportNote}
              </span>
            )}
            <RateBar periods={section.exportPeriods} />
            <TimeLabels periods={section.exportPeriods} />
          </div>
        </div>
      )}
    </div>
  );

  if (section.header) {
    return <div className="bg-white border border-[#F7F7F7] rounded-[14px] p-8 w-full">{body}</div>;
  }
  return body;
}
