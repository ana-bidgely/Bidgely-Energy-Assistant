'use client';

import { useState } from 'react';
import type { HourlyProfileSection } from '../../types';

interface Props {
  section: HourlyProfileSection;
}

const KPI_SURFACE: Record<HourlyProfileSection['kpis'][number]['tone'], { bg: string; border: string; value: string }> = {
  solar: { bg: '#FFF7ED', border: '#FED7AA', value: '#F59E0B' },
  usage: { bg: '#EFF6FF', border: '#BFDBFE', value: '#186CDD' },
  green: { bg: '#F0FDF4', border: '#BBF7D0', value: '#10B981' },
};

// Legend dot colors — correct mapping (the original legend_blue.svg /
// legend_orange.svg asset files have their colors swapped from what their
// names say, which is part of why this got confusing; drawing them inline
// sidesteps that file entirely).
const LEGEND_COLOR: Record<'orange' | 'blue' | 'green', string> = {
  orange: '#FF991A',
  blue: '#186CDD',
  green: '#29B57A',
};

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Seasonal factors normalized so Jun = 1.00 (the Figma baseline month), ported
// from the same shape as computations.ts's MONTHLY_PROFILE / consumptionProfile
// so the fake data stays thematically consistent with the rest of the report.
const SOLAR_SEASONAL: Record<string, number> = {
  Jan: 0.551, Feb: 0.610, Mar: 0.763, Apr: 0.864, May: 0.949, Jun: 1.000,
  Jul: 1.017, Aug: 0.975, Sep: 0.881, Oct: 0.780, Nov: 0.610, Dec: 0.492,
};
const USAGE_SEASONAL: Record<string, number> = {
  Jan: 1.474, Feb: 1.346, Mar: 1.218, Apr: 1.090, May: 1.026, Jun: 1.000,
  Jul: 1.000, Aug: 1.026, Sep: 1.090, Oct: 1.218, Nov: 1.346, Dec: 1.474,
};
// Weekends skew usage up a bit (more time home) — same intuition the solar
// refine flow's off-peak logic uses elsewhere in the app.
const WEEKEND_USAGE_MULT = 1.12;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

interface Metrics {
  solar: number;
  usage: number;
  selfSufficient: number;
  exported: number;
}

function computeDayMetrics(baseSolar: number, baseUsage: number, month: string, tabIndex: number): Metrics {
  const solar = baseSolar * (SOLAR_SEASONAL[month] ?? 1);
  let usage = baseUsage * (USAGE_SEASONAL[month] ?? 1);
  if (tabIndex === 1) usage *= WEEKEND_USAGE_MULT; // blended weekday/weekend average
  const selfSufficient = clamp(Math.round((solar / usage) * 100), 0, 100);
  const exported = clamp(Math.round((solar / (solar + usage)) * 100), 0, 95);
  return { solar: round1(solar), usage: round1(usage), selfSufficient, exported };
}

function computeWeekMetrics(baseSolar: number, baseUsage: number, month: string) {
  const dailySolar = baseSolar * (SOLAR_SEASONAL[month] ?? 1);
  const weekdayUsage = baseUsage * (USAGE_SEASONAL[month] ?? 1);
  const weekendUsage = weekdayUsage * WEEKEND_USAGE_MULT;
  const weeklySolar = dailySolar * 7;
  const weeklyUsage = weekdayUsage * 5 + weekendUsage * 2;
  const selfSufficient = clamp(Math.round((weeklySolar / weeklyUsage) * 100), 0, 100);
  const exported = clamp(Math.round((weeklySolar / (weeklySolar + weeklyUsage)) * 100), 0, 95);
  return {
    metrics: { solar: round1(weeklySolar), usage: round1(weeklyUsage), selfSufficient, exported } as Metrics,
    dailySolar,
    weekdayUsage,
    weekendUsage,
  };
}

// Curve artwork — ported verbatim (viewBox + path data) from
// public/solar-hourly/*.svg, inlined directly instead of loaded via <img
// src>. Those files are all `preserveAspectRatio="none"` with percentage
// width/height and no absolute size, which some browsers can only resolve by
// falling back to a generic default size — if that resolution hiccups (or the
// asset request itself is slow/fails right as the dev server restarts), the
// <img> collapses to zero height and the whole chart renders as just axes
// with broken-image icons in the legend. Inlining removes the network
// dependency and the ambiguous-intrinsic-size guesswork entirely.
function CurveLayer({ viewBox, d, fill, fillOpacity, stroke, strokeDasharray }: {
  viewBox: string;
  d: string;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeDasharray?: string;
}) {
  return (
    <svg viewBox={viewBox} preserveAspectRatio="none" className="w-full h-full block" aria-hidden="true">
      <path
        d={d}
        fill={fill ?? 'none'}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={stroke ? 2.5 : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
      />
    </svg>
  );
}

const ORANGE_FILL_D = 'M0 0.162853C16.3319 0.162853 57.1199 -0.137147 81.5759 0.162853C106.032 0.462853 106.032 -1.13715 122.28 1.86285C138.612 4.86285 144.056 6.46285 163.068 15.1629C182.08 23.8629 195.732 34.1629 217.424 45.1629C239.2 56.1629 250.088 62.4628 271.78 70.1628C293.556 77.8628 304.444 81.8629 326.22 83.4629C347.912 85.1629 358.8 84.1629 380.576 78.4629C402.268 72.8629 413.156 65.8629 434.932 55.1629C456.624 44.4629 472.956 34.8629 489.288 25.1629C505.62 15.4629 505.62 11.6629 516.424 6.86285C527.312 1.96285 532.756 2.36285 543.644 0.962853C554.532 -0.337147 559.976 0.362853 570.78 0.162853C581.668 -0.0371475 592.556 0.162853 598 0.162853V0.162853H0Z';
const ORANGE_LINE_D = 'M1.25 1.41298C17.5819 1.41298 58.3699 1.11298 82.8259 1.41298C107.282 1.71298 107.282 0.112982 123.53 3.11298C139.862 6.11298 145.306 7.71298 164.318 16.413C183.33 25.113 196.982 35.413 218.674 46.413C240.45 57.413 251.338 63.713 273.03 71.413C294.806 79.113 305.694 83.113 327.47 84.713C349.162 86.413 360.05 85.413 381.826 79.713C403.518 74.113 414.406 67.113 436.182 56.413C457.874 45.713 474.206 36.113 490.538 26.413C506.87 16.713 506.87 12.913 517.674 8.11298C528.562 3.21298 534.006 3.61298 544.894 2.21298C555.782 0.912982 561.226 1.61298 572.03 1.41298C582.918 1.21298 593.806 1.41298 599.25 1.41298';
const BLUE_FILL_D = 'M0 14.6943C10.888 15.6943 32.5801 18.1943 54.356 19.6943C76.1319 21.1943 87.0199 22.7943 108.712 22.1943C130.488 21.4943 141.376 20.6943 163.068 16.2943C184.844 11.9943 195.732 2.4943 217.424 0.494303C239.2 -1.5057 250.088 2.9943 271.78 6.2943C293.556 9.6943 304.444 14.6943 326.22 17.1943C347.912 19.6943 358.8 18.7943 380.576 18.7943C402.268 18.7943 413.156 18.6943 434.932 17.1943C456.624 15.6943 467.512 13.7943 489.288 11.2943C510.98 8.7943 521.868 3.2943 543.644 4.6943C565.42 5.9943 587.112 15.2943 598 17.9943V52.9943H0V14.6943Z';
const BLUE_LINE_D = 'M1.25008 15.9425C12.138 16.9425 33.8302 19.4425 55.6061 20.9425C77.382 22.4425 88.27 24.0425 109.962 23.4425C131.738 22.7425 142.626 21.9425 164.318 17.5425C186.094 13.2425 196.982 3.74248 218.674 1.74248C240.45 -0.25752 251.338 4.24248 273.03 7.54248C294.806 10.9425 305.694 15.9425 327.47 18.4425C349.162 20.9425 360.05 20.0425 381.826 20.0425C403.518 20.0425 414.406 19.9425 436.182 18.4425C457.874 16.9425 468.762 15.0425 490.538 12.5425C512.23 10.0425 523.118 4.54248 544.894 5.94248C566.67 7.24248 588.362 16.5425 599.25 19.2425';
const GREEN_FILL_D = 'M0 0.265894C27.2199 0.265894 100.588 -0.332367 135.932 0.265894C171.276 0.864154 160.388 -0.332367 176.72 3.65604C192.968 7.64444 198.412 10.2369 217.424 20.2079C236.52 30.1789 250.088 42.1441 271.78 53.5111C293.556 64.6786 304.444 73.4531 326.22 76.6439C347.912 80.034 358.8 78.0398 380.576 70.063C402.268 62.0862 415.92 48.1268 434.932 36.7598C453.944 25.5923 462.068 20.2079 475.72 13.6271C489.288 6.84676 494.732 6.2485 502.856 3.65604C510.98 0.864155 497.412 0.864154 516.424 0.265894C535.52 -0.332367 581.668 0.265894 598 0.265894V0.265894H0Z';
const GREEN_LINE_D = 'M1 1.26585C28.2199 1.26585 101.588 0.667593 136.932 1.26585C172.276 1.86411 161.388 0.667593 177.72 4.656C193.968 8.6444 199.412 11.2369 218.424 21.2079C237.52 31.1789 251.088 43.1441 272.78 54.5111C294.556 65.6786 305.444 74.4531 327.22 77.6438C348.912 81.034 359.8 79.0398 381.576 71.0629C403.268 63.0861 416.92 49.1267 435.932 37.7598C454.944 26.5922 463.068 21.2079 476.72 14.627C490.288 7.84672 495.732 7.24846 503.856 4.656C511.98 1.86411 498.412 1.86411 517.424 1.26585C536.52 0.667593 582.668 1.26585 599 1.26585';

// HourlyProfile — tabbed usage/generation chart (Figma solar report). Tabs and
// month pills are interactive: the KPI tiles and chart recompute from the
// report's original baseline (parsed off section.kpis) using seasonal
// factors, so every combination looks internally consistent without needing
// real per-month telemetry. The area-chart layers are inlined SVG artwork
// (ported verbatim from the design export); rather than swap in new artwork
// per month we scale each layer with a CSS transform, so the curve shape
// still reads as "the same chart, bigger/smaller" — good enough for a demo,
// not a real per-hour recomputation. "Weekly totals" swaps to a small
// day-by-day bar chart instead, since a 7-day view isn't an hourly curve at
// all.
export function HourlyProfile({ section }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [activeMonth, setActiveMonth] = useState(section.activeMonth);

  const baseSolar = parseFloat(section.kpis[0]?.value) || 46.4;
  const baseUsage = parseFloat(section.kpis[1]?.value) || 45.8;
  const isDefault = activeTab === 0 && activeMonth === section.activeMonth;

  const dayMetrics = computeDayMetrics(baseSolar, baseUsage, activeMonth, activeTab);
  const week = activeTab === 2 ? computeWeekMetrics(baseSolar, baseUsage, activeMonth) : null;
  const metrics = activeTab === 2 ? week!.metrics : dayMetrics;

  const displayKpis: HourlyProfileSection['kpis'] = isDefault
    ? section.kpis
    : [
        { label: activeTab === 2 ? 'Weekly solar' : 'Daily solar', value: `${metrics.solar} kWh`, tone: 'solar' },
        { label: activeTab === 2 ? 'Weekly usage' : 'Daily usage', value: `${metrics.usage} kWh`, tone: 'usage' },
        { label: 'Self-sufficient', value: `${metrics.selfSufficient}%`, tone: 'green' },
        { label: 'Solar exported', value: `${metrics.exported}%`, tone: 'green' },
      ];

  const subtext =
    activeTab === 0
      ? `Average day in ${activeMonth} - hour by hour`
      : activeTab === 1
      ? `Weekday vs weekend average in ${activeMonth}`
      : `Representative week in ${activeMonth}`;

  const displayXAxisLabels = activeTab === 2 ? WEEK_DAYS : section.xAxisLabels;
  const displayYAxisLabels = activeTab === 2
    ? [`${Math.ceil((week!.dailySolar * 1.3) / 10) * 10} kWh`, `${Math.round((week!.dailySolar * 1.3) / 2 / 10) * 10} kWh`, '0 kWh']
    : section.yAxisLabels;

  // Chart layer scale factors — 1.0 at the untouched default state so the
  // very first render is pixel-identical to before any clicks.
  const solarScale = isDefault ? 1 : clamp(SOLAR_SEASONAL[activeMonth] ?? 1, 0.55, 1.3);
  const usageScale = isDefault
    ? 1
    : clamp((USAGE_SEASONAL[activeMonth] ?? 1) * (activeTab === 1 ? WEEKEND_USAGE_MULT : 1), 0.55, 1.4);
  const exportScale = isDefault ? 1 : clamp(metrics.exported / 52, 0.5, 1.4);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.04)] p-10 flex flex-col gap-6 w-full">
      <p className="text-[12px] leading-[16px] font-semibold text-[#262E40]">{section.label}</p>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {section.tabs.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`rounded-full px-4 py-2 text-[13px] transition-colors ${
              i === activeTab
                ? 'bg-[#186CDD] border border-[#186CDD] text-white font-semibold'
                : 'border border-[#EFEFEF] text-[#66758D] font-medium hover:border-[#186CDD]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Month pills */}
      <div className="flex gap-1 w-full">
        {section.months.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setActiveMonth(m)}
            className={`flex-1 text-center rounded-2xl py-1.5 px-1 text-[13px] transition-colors ${
              m === activeMonth
                ? 'bg-[#186CDD] border border-[#186CDD] text-white font-semibold'
                : 'border border-[#DFDFE0] text-[#66758D] hover:border-[#186CDD]'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <p className="text-[12px] text-[#66758D]">{subtext}</p>

      {/* KPI row */}
      <div className="flex gap-3">
        {displayKpis.map((kpi) => {
          const s = KPI_SURFACE[kpi.tone];
          return (
            <div
              key={kpi.label}
              className="flex-1 rounded-xl p-3 flex flex-col items-center gap-1 border"
              style={{ background: s.bg, borderColor: s.border }}
            >
              <p className="text-[18px] font-bold m-0" style={{ color: s.value }}>{kpi.value}</p>
              <p className="text-[12px] text-[#66758D] m-0">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {activeTab === 2 && week ? (
        // Weekly totals — a day-by-day view doesn't read as an hourly curve,
        // so swap to a small grouped bar chart (solar vs usage per day).
        <div className="flex gap-3" style={{ height: 240 }}>
          <div className="flex flex-col justify-between text-[12px] text-[#66758D] text-right" style={{ height: 200 }}>
            {displayYAxisLabels.map((l) => <span key={l}>{l}</span>)}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="relative w-full flex items-end justify-between gap-2" style={{ height: 200 }}>
              {WEEK_DAYS.map((day, i) => {
                const isWeekend = i >= 5;
                const dayUsage = isWeekend ? week.weekendUsage : week.weekdayUsage;
                const maxVal = week.dailySolar * 1.3 || 1;
                const solarH = clamp((week.dailySolar / maxVal) * 200, 4, 200);
                const usageH = clamp((dayUsage / maxVal) * 200, 4, 200);
                return (
                  <div key={day} className="flex-1 flex items-end justify-center gap-1" style={{ height: 200 }}>
                    <div className="rounded-t-sm" style={{ width: 10, height: usageH, background: LEGEND_COLOR.blue }} title={`Usage: ${round1(dayUsage)} kWh`} />
                    <div className="rounded-t-sm" style={{ width: 10, height: solarH, background: LEGEND_COLOR.orange }} title={`Solar: ${round1(week.dailySolar)} kWh`} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[12px] text-[#66758D]">
              {WEEK_DAYS.map((d) => <span key={d}>{d}</span>)}
            </div>
          </div>
        </div>
      ) : (
        // Hourly avg / Weekday vs Weekend — inlined SVG area chart, scaled
        // per layer to fake the seasonal / weekend swing.
        <div className="flex gap-3" style={{ height: 240 }}>
          <div className="flex flex-col justify-between text-[12px] text-[#66758D] text-right" style={{ height: 200 }}>
            {displayYAxisLabels.map((l) => <span key={l}>{l}</span>)}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="relative w-full overflow-hidden" style={{ height: 200 }}>
              {[0, 50, 100, 150, 199].map((top) => (
                <div key={top} className="absolute left-0 w-full h-px bg-[#EFEFEF]" style={{ top }} />
              ))}
              {/* Orange = Solar Generation (per legend), scaled by the seasonal solar factor.
                  Height comes from the artwork's own aspect ratio (not a fixed px value) —
                  each of the three layers has a different natural height, and forcing them
                  all to the same fixed height stretched the curves out of proportion and
                  past the chart's bottom edge. */}
              <div className="absolute left-0 w-full" style={{ top: 100, aspectRatio: '598 / 84.2121', transform: `scaleY(${solarScale})`, transformOrigin: 'bottom' }}>
                <CurveLayer viewBox="0 0 598 84.2121" d={ORANGE_FILL_D} fill={LEGEND_COLOR.orange} fillOpacity={0.18} />
                <div className="absolute inset-0">
                  <CurveLayer viewBox="0 0 600.5 86.712" d={ORANGE_LINE_D} stroke={LEGEND_COLOR.orange} />
                </div>
              </div>
              {/* Blue = Home Consumption (per legend), scaled by the seasonal usage factor */}
              <div className="absolute left-0 w-full" style={{ top: 47, aspectRatio: '598 / 52.9943', transform: `scaleY(${usageScale})`, transformOrigin: 'bottom' }}>
                <CurveLayer viewBox="0 0 598 52.9943" d={BLUE_FILL_D} fill={LEGEND_COLOR.blue} fillOpacity={0.12} />
                <div className="absolute inset-0">
                  <CurveLayer viewBox="0 0 600.5 24.8216" d={BLUE_LINE_D} stroke={LEGEND_COLOR.blue} />
                </div>
              </div>
              {/* Green = Grid Export (per legend), scaled by the exported-% ratio */}
              <div className="absolute left-0 w-full" style={{ top: 19, aspectRatio: '598 / 78.2266', transform: `scaleY(${exportScale})`, transformOrigin: 'bottom' }}>
                <CurveLayer viewBox="0 0 598 78.2266" d={GREEN_FILL_D} fill={LEGEND_COLOR.green} fillOpacity={0.1} />
                <div className="absolute inset-0">
                  <CurveLayer viewBox="0 0 600 80.2265" d={GREEN_LINE_D} stroke={LEGEND_COLOR.green} strokeDasharray="6 4" />
                </div>
              </div>
            </div>
            <div className="flex justify-between text-[12px] text-[#66758D]">
              {displayXAxisLabels.map((l, i) => <span key={i}>{l}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-6 justify-center">
        {section.legend.map((item) => (
          <div key={item.label} className="flex gap-2 items-center">
            <span
              className="inline-block w-3.5 h-3.5 rounded-full border-2"
              style={{
                borderColor: LEGEND_COLOR[item.swatch],
                background: `${LEGEND_COLOR[item.swatch]}30`,
                borderStyle: item.swatch === 'green' ? 'dashed' : 'solid',
              }}
            />
            <span className="text-[12px] text-[#66758D]">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Footer notes */}
      <div className="border-t border-[#E5E7EB] pt-4 flex gap-5 flex-wrap">
        {section.footerNotes.map((note, i) => (
          <div key={i} className="flex gap-1.5 items-center text-[12px] text-[#66758D]">
            {note}
          </div>
        ))}
      </div>
    </div>
  );
}
