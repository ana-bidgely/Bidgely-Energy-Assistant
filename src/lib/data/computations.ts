import type { User } from './user';
import type { Report } from '@/report/types';
import type { EvInputs } from '@/lib/chat/types';

// ─── Solar constants (ported from original HTML) ────────────────────────────
const PEAK_SUN_HRS = 5.0;
const SYSTEM_EFF = 0.80;
const COST_PER_KW = 3100;
const FEDERAL_ITC = 0.30;

export type RoofSize = 'small' | 'medium' | 'large';
export type ShadeLevel = 'none' | 'partial' | 'heavy';

const ROOF_KW: Record<RoofSize, number> = {
  small: 3.5,
  medium: 0,   // auto-sized to consumption
  large: 7.5,
};

const SHADE_FACTOR: Record<ShadeLevel, number> = {
  none:    1.0,
  partial: 0.85,
  heavy:   0.60,
};

export type Orientation = 'south' | 'east' | 'west' | 'north';

// Relative generation yield by roof orientation (south-facing is optimal
// in the northern hemisphere; east/west lose some midday sun, north loses most).
const ORIENTATION_FACTOR: Record<Orientation, number> = {
  south: 1.0,
  east:  0.93,
  west:  0.93,
  north: 0.78,
};

const ORIENTATION_LABEL: Record<Orientation, string> = {
  south: 'South-facing',
  east:  'East-facing',
  west:  'West-facing',
  north: 'North-facing',
};

// Monthly generation profile (relative weights, sums to ~12)
const MONTHLY_PROFILE = [0.65, 0.72, 0.90, 1.02, 1.12, 1.18, 1.20, 1.15, 1.04, 0.92, 0.72, 0.58];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export interface SolarMetrics {
  systemKw: number;
  annualGenerationKwh: number;
  annualUsageKwh: number;
  coveragePct: number;
  annualSavings: number;
  monthlySavings: number;
  grossCost: number;
  netCost: number;
  paybackYears: number;
  twentyYearSavings: number;
  co2OffsetLbs: number;
  treesEquivalent: number;
}

export function computeSolarMetrics(
  roof: RoofSize,
  shade: ShadeLevel,
  user: User,
  orientation: Orientation = 'south',
  installCostPerW: number = COST_PER_KW / 1000,
): SolarMetrics {
  const avgMonthlyKwh = user.bill.kwh;
  const annualUsageKwh = avgMonthlyKwh * 12;
  const avgRate = (user.bill.electricCost / user.bill.kwh);

  // System size
  let systemKw = ROOF_KW[roof];
  if (roof === 'medium') {
    // Size to cover ~90% of annual usage
    systemKw = (annualUsageKwh * 0.9) / (PEAK_SUN_HRS * 365 * SYSTEM_EFF);
    systemKw = Math.round(systemKw * 10) / 10;
  }

  const shadeFactor = SHADE_FACTOR[shade];
  const orientationFactor = ORIENTATION_FACTOR[orientation];
  const annualGenerationKwh = systemKw * PEAK_SUN_HRS * 365 * SYSTEM_EFF * shadeFactor * orientationFactor;
  const coveragePct = Math.min(100, Math.round((annualGenerationKwh / annualUsageKwh) * 100));

  const annualSavings = Math.round(annualGenerationKwh * avgRate);
  const monthlySavings = Math.round(annualSavings / 12);

  const grossCost = systemKw * installCostPerW * 1000;
  const netCost = grossCost * (1 - FEDERAL_ITC);
  const paybackYears = parseFloat((netCost / annualSavings).toFixed(1));
  const twentyYearSavings = Math.round(annualSavings * 20 - netCost);

  // Environmental
  const co2OffsetLbs = Math.round(annualGenerationKwh * 0.92);
  const treesEquivalent = Math.round(co2OffsetLbs / 48);

  return {
    systemKw,
    annualGenerationKwh: Math.round(annualGenerationKwh),
    annualUsageKwh,
    coveragePct,
    annualSavings,
    monthlySavings,
    grossCost: Math.round(grossCost),
    netCost: Math.round(netCost),
    paybackYears,
    twentyYearSavings,
    co2OffsetLbs,
    treesEquivalent,
  };
}

export interface SolarRefineOverrides {
  orientation?: Orientation;
  installCostPerW?: number;
  /** True once the "What if?" refine flow has fully completed — flips the
   *  report's assumptions block from "ASSUMPTIONS" to "YOUR INPUTS". Kept
   *  separate from the field overrides above so the panel can live-preview
   *  each answer as it's picked (mid-flow) without prematurely relabeling
   *  the whole block as user-provided before the flow is actually done. */
  refined?: boolean;
  /** Which of the four refine-flow fields the user actually answered vs
   *  left as "keep the estimate". Only meaningful when `refined` is true —
   *  answered fields render under "YOUR INPUTS", the rest (plus "Usable
   *  sunlight", which is never asked) render under "ASSUMPTIONS:". */
  provided?: {
    roof: boolean;
    shade: boolean;
    orientation: boolean;
    installCostPerW: boolean;
  };
}

export function buildDynamicSolarReport(
  roof: RoofSize,
  shade: ShadeLevel,
  user: User,
  overrides?: SolarRefineOverrides,
): Report {
  // roof/shade come in from the caller (auto-detected, or live-previewed from
  // the refine flow's in-progress answers); orientation/installCostPerW have
  // no auto-detected equivalent so they default when not yet answered.
  const effRoof: RoofSize = roof;
  const effShade: ShadeLevel = shade;
  const orientation: Orientation = overrides?.orientation ?? 'south';
  const installCostPerW = overrides?.installCostPerW ?? COST_PER_KW / 1000;
  const refined = !!overrides?.refined;

  const m = computeSolarMetrics(effRoof, effShade, user, orientation, installCostPerW);
  const avgRate = user.bill.electricCost / user.bill.kwh;

  // Annual costs
  const annualBillToday = Math.round(user.bill.electricCost * 12);
  const annualBillWithSolar = Math.max(0, annualBillToday - m.annualSavings);
  const twentyFiveYearGain = Math.round(m.annualSavings * 25 - m.netCost);

  // Monthly consumption vs generation chart (12 months)
  const profileSum = MONTHLY_PROFILE.reduce((a, b) => a + b, 0);
  // Seasonal consumption profile (winter higher, summer lower for typical CA home)
  const consumptionProfile = [1.15, 1.05, 0.95, 0.85, 0.80, 0.78, 0.78, 0.80, 0.85, 0.95, 1.05, 1.15];
  const monthlyData = MONTHS_SHORT.map((month, i) => ({
    month,
    consumption: Math.round(user.bill.kwh * consumptionProfile[i]),
    generation: Math.round((m.annualGenerationKwh * MONTHLY_PROFILE[i]) / profileSum),
  }));
  const yMax = Math.ceil(Math.max(...monthlyData.flatMap(d => [d.consumption, d.generation])) / 100) * 100;

  // Roof descriptors
  const roofDesc = {
    small:  { sqFt: '~400 sq ft', label: `small ${ORIENTATION_LABEL[orientation].toLowerCase()} roof` },
    medium: { sqFt: '~700 sq ft', label: `medium ${ORIENTATION_LABEL[orientation].toLowerCase()} roof` },
    large:  { sqFt: '~1,000 sq ft', label: `large ${ORIENTATION_LABEL[orientation].toLowerCase()} roof` },
  }[effRoof];
  const shadeDesc = {
    none:    'minimal shading',
    partial: 'partial shading',
    heavy:   'heavy shading',
  }[effShade];
  const shadeChipDesc = {
    none:    'Minimal shading',
    partial: 'Moderate shading',
    heavy:   'Heavy shading',
  }[effShade];
  const sunHours = (PEAK_SUN_HRS * SHADE_FACTOR[effShade] * ORIENTATION_FACTOR[orientation]).toFixed(1);
  const panelCount = Math.round(m.systemKw / 0.4);
  const roofSqFt = panelCount * 20;

  // Size comparison alternatives
  const smallerKw = Math.max(2, Math.round((m.systemKw - 3) * 10) / 10);
  const largerKw  = Math.round((m.systemKw + 3) * 10) / 10;
  function quickPayback(kw: number): { netCost: string; payback: string } {
    const netCost = kw * installCostPerW * 1000 * (1 - FEDERAL_ITC);
    const annualSav = kw * PEAK_SUN_HRS * 365 * SYSTEM_EFF * SHADE_FACTOR[effShade] * ORIENTATION_FACTOR[orientation] * avgRate;
    return {
      netCost: `$${Math.round(netCost).toLocaleString()}`,
      payback: `${(netCost / annualSav).toFixed(1)} yrs`,
    };
  }
  const smaller = quickPayback(smallerKw);
  const larger  = quickPayback(largerKw);

  return {
    id: `solar-${user.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    title: "Here's what going solar looks like for you.",
    titleAccentWords: ['going', 'solar'],
    subtitle:
      'Based on 12 months of your actual usage and the conditions at your address.',
    generatedAt: new Date().toISOString(),
    customer: {
      name: user.name,
      accountNumber: '4821-09',
      address: user.address,
      zip: user.zip,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    },
    branding: {
      companyName: user.utility + '.',
      primaryColor: '#125AAA',
    },
    sections: [
      {
        type: 'kpi-row',
        kpis: [
          {
            label: 'ANNUAL SAVINGS',
            value: `$${m.annualSavings.toLocaleString()}`,
            subtext: `Bill drops from $${annualBillToday.toLocaleString()} → $${annualBillWithSolar.toLocaleString()}`,
            accent: 'green',
          },
          {
            label: '25-YEAR NET GAIN',
            value: `+$${twentyFiveYearGain.toLocaleString()}`,
            subtext: 'Over system lifetime',
            // Figma 1476:8821 fills this tile with Web/Blue/300 (#B5E4FF), not
            // the lavender Web/Violet/300. Sky-blue reads as "lifetime / NPV"
            // semantic; lavender is reserved for educational/info contexts.
            accent: 'blue',
          },
        ],
      },
      {
        type: 'bar-comparison',
        title: 'ANNUAL BILL COMPARISON',
        items: [
          {
            label: 'Today',
            value: annualBillToday,
            displayValue: `$${annualBillToday.toLocaleString()}`,
            color: '#1467D5',
          },
          {
            label: 'With Solar',
            value: annualBillWithSolar,
            displayValue: `$${annualBillWithSolar.toLocaleString()}`,
            color: '#5BD584',
          },
        ],
      },
      {
        type: 'monthly-chart',
        title: 'CONSUMPTION VS GENERATION',
        yMax,
        yUnit: 'kWh',
        series: {
          consumptionLabel: 'Your Consumption',
          generationLabel: 'Solar generation',
        },
        data: monthlyData,
        insight:
          'Solar production peaks in summer; your usage stays flat year-round. A smaller system covers summer fine but leaves winter short.',
      },
      {
        type: 'hourly-profile',
        label: 'HOURLY PROFILE',
        tabs: ['Hourly avg', 'Weekday vs Weekend', 'Weekly totals'],
        months: MONTHS_SHORT.map((m) => (m === 'Jun' ? 'Jun' : m)),
        activeMonth: 'Jun',
        subtext: 'Average day in Jun - hour by hour',
        kpis: [
          { label: 'Daily solar', value: '46.4 kWh', tone: 'solar' },
          { label: 'Daily usage', value: '45.8 kWh', tone: 'usage' },
          { label: 'Self-sufficient', value: '100%', tone: 'green' },
          { label: 'Solar exported', value: '52%', tone: 'green' },
        ],
        yAxisLabels: ['6000W', '3000W', '0W', '-3000W', '-6000W'],
        xAxisLabels: ['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'],
        legend: [
          { label: 'Home Consumption', swatch: 'blue' },
          { label: 'Solar Generation', swatch: 'orange' },
          { label: 'Grid Export', swatch: 'green' },
        ],
        footerNotes: ['☀️ Solar peaks midday', '🏠 Consumption peaks evenings', '🟢 Green shaded = power back to grid'],
      },
      {
        type: 'system-recommendation',
        label: 'YOUR RECOMMENDED SYSTEM',
        sizeKw: m.systemKw,
        panelCount,
        roofSqFt,
        whySizeBody:
          "More panels don't always save more money. Excess solar generation is often exported at a much lower value than the electricity you buy later, so oversized systems can reduce financial returns.",
        financials: [
          {
            label: 'NET COST',
            value: `$${m.netCost.toLocaleString()}`,
            subtext: 'Including all rebates',
          },
          {
            label: 'PAYBACK PERIOD',
            value: `${m.paybackYears} years`,
            subtext: 'Out of a 25–30 year life',
          },
          {
            label: 'ANNUAL SAVINGS',
            value: `$${m.annualSavings.toLocaleString()}`,
            subtext: `+$${twentyFiveYearGain.toLocaleString()} over 25 years`,
            highlight: true,
          },
        ],
      },
      {
        type: 'size-comparison',
        options: [
          {
            label: `Smaller — ${smallerKw} kW`,
            subtext: `${Math.round(smallerKw / 0.4)} panels`,
            netCost: smaller.netCost,
            payback: smaller.payback,
            verdict:
              "Faster payback, but leaves savings on the table over the system's lifetime.",
          },
          {
            label: `${m.systemKw} kW`,
            subtext: `${panelCount} panels`,
            netCost: `$${m.netCost.toLocaleString()}`,
            payback: `${m.paybackYears} yrs`,
            verdict:
              `The sweet spot — covers ${m.coveragePct}% of your usage without producing cheap exports.`,
            isRecommended: true,
          },
          {
            label: `Larger — ${largerKw} kW`,
            subtext: `${Math.round(largerKw / 0.4)} panels`,
            netCost: larger.netCost,
            payback: larger.payback,
            verdict:
              'Bigger upfront cost; surplus generation sells at low export rates, so payback is similar.',
          },
        ],
        caption: 'Modeled at the maximum installable capacity of 25 kW',
      },
      {
        type: 'rate-plan',
        plans: [
          {
            label: 'YOUR CURRENT RATE PLAN',
            title: 'Rate Plan- 180',
            description:
              'This is your current electricity rate plan. It may not fully utilize the value of your solar generation.',
            importPeriods: [],
            usageChart: { variant: 'flat' },
            annualSavings: `$${(m.annualSavings - 260).toLocaleString()}`,
          },
          {
            label: 'RECOMMENDED',
            title: 'Rate Plan- 240',
            description:
              'Based on our analysis, this plan is expected to maximize the value of your solar generation.',
            importPeriods: [],
            usageChart: {
              variant: 'tou',
              segments: [
                { label: 'Off Peak', tone: 'off-peak', widthFr: 9, heightFr: 0.85 },
                { label: 'Mid Peak', tone: 'mid-peak', widthFr: 6, heightFr: 0.5 },
                { label: 'Peak',     tone: 'peak',      widthFr: 5, heightFr: 0.9 },
                { tone: 'mid-peak',                     widthFr: 4, heightFr: 0.5 },
              ],
              timeLabels: ['12 AM', '9 AM', '3 PM', '8 PM', '12 AM'],
            },
            annualSavings: `$${m.annualSavings.toLocaleString()}`,
            annualSavingsDelta: '+$260/yr',
            insight:
              'Move dishwasher, pool pump, and EV charging into 9a–4p to capture the full benefit.',
            isRecommended: true,
          },
        ],
        exportPeriods: [
          // Figma 1476:9039 export bar segments use the same tier ramp as the
          // import bars: low rate = off_peak (mint), mid rate = mid_peak
          // (yellow), peak rate = on_peak (pink). Tier drives the color so
          // the export pill reads consistently with the import pills above.
          { timeRange: '12a–9a', rate: '6¢',  tier: '$',   widthFr: 9 },
          { timeRange: '9a–4p',  rate: '4¢',  tier: '$$',  widthFr: 7 },
          { timeRange: '4–9p',   rate: '35¢', tier: '$$$', widthFr: 5 },
          { timeRange: '9p–12a', rate: '6¢',  tier: '$',   widthFr: 3 },
        ],
        exportNote: 'EXPORT RATES (SAME FOR EVERY PLAN)',
      },
      (() => {
        const roofChip = { label: 'Usable roof', value: roofDesc.sqFt };
        const orientationChip = { label: 'Roof orientation', value: ORIENTATION_LABEL[orientation] };
        const shadeChip = { label: 'Shading', value: shadeChipDesc };
        const sunlightChip = { label: 'Usable sunlight', value: `~${sunHours} hr/day` };
        const costChip = { label: 'Install cost', value: `$${installCostPerW.toFixed(2)}/W${refined ? '' : ' typical'}` };

        // Not refined yet — same flat ASSUMPTIONS list as always.
        if (!refined) {
          return {
            type: 'inputs' as const,
            headline: 'ASSUMPTIONS',
            assumptions: [roofChip, orientationChip, shadeChip, sunlightChip, costChip],
          };
        }

        // Refined — split into fields the user actually answered ("YOUR
        // INPUTS") vs fields they left as "keep the estimate" (folded back
        // into "ASSUMPTIONS:" alongside "Usable sunlight", which is never
        // asked and is always an estimate).
        const provided = overrides?.provided;
        const primary: { label: string; value: string }[] = [];
        const secondary: { label: string; value: string }[] = [];
        for (const [key, chip] of [
          ['roof', roofChip],
          ['orientation', orientationChip],
          ['shade', shadeChip],
          ['installCostPerW', costChip],
        ] as const) {
          (provided?.[key] ? primary : secondary).push(chip);
        }
        secondary.push(sunlightChip);

        return {
          type: 'inputs' as const,
          headline: 'YOUR INPUTS',
          assumptions: primary,
          secondaryLabel: 'ASSUMPTIONS:',
          secondaryChips: secondary,
        };
      })(),
      {
        type: 'neighborhood',
        count: 247,
        headline: 'Solar installations in your ZIP code',
        body: 'Homes with similar sun exposure, already seeing the savings.',
      },
      {
        type: 'faq',
        items: [
          {
            question: 'Is my roof suitable for solar?',
            answer:
              `We used satellite imagery and your address to assess roof area, pitch, orientation, and shading. Your ${roofDesc.label} (${roofDesc.sqFt}) with ${shadeDesc} is well above the 200 sq ft minimum. If you've recently added structures or removed trees, the analysis may need updating.`,
          },
          {
            question: 'How do I pick a good installer?',
            answer:
              'Look for NABCEP-certified installers with strong local reviews. Get at least 3 quotes. Check that they handle permitting, interconnection, and warranty (25-year panel, 10-year workmanship). Your utility may have a list of approved contractors.',
          },
          {
            question: 'Buy, lease, or PPA?',
            answer:
              'Buying (cash or loan) gives you the highest long-term return and the federal tax credit. Leasing means lower upfront cost but the leasing company owns the system. A PPA (Power Purchase Agreement) means you pay a fixed rate for the solar power — no upfront cost, but no ownership benefits.',
          },
          {
            question: 'What if I sell the home before payback period?',
            answer:
              'Solar typically increases home value by 3–4% (Zillow research). Owned systems transfer to the buyer and are a selling point. If you sell before payback, you may recover most of your investment through the higher sale price. Leased systems require the buyer to assume the lease.',
          },
          {
            question: 'Do I need a battery?',
            answer:
              "Not required — solar works without one. A battery stores excess daytime production for evening use, reducing peak-hour grid purchases. It makes the most financial sense on TOU rate plans with large peak/off-peak price spreads. See our battery analysis if you're interested.",
          },
          {
            question: 'What happens after 25 years?',
            answer:
              'Panels degrade ~0.5%/yr, so at year 25 they\'re still producing ~87% of original output. Most panels last 30–35 years. The inverter may need replacement around year 12–15 (~$1,500–$2,500). After payback, every kWh is essentially free.',
          },
        ],
      },
      {
        type: 'cta-banner',
        headline: 'Switch plans when your system goes live',
        subtext: 'energy.co/rate-plan',
        buttonLabel: 'Switch Rate Plan →',
        buttonUrl: 'https://energy.co/rate-plan',
        variant: 'rate',
      },
    ],
  };
}

// ─── EV computations ─────────────────────────────────────────────────────────
export interface EvMetrics {
  currentMonthlyCost: number;
  optimizedMonthlyCost: number;
  annualSavings: number;
  bestPlan: string;
  bestPlanRate: number;
  offPeakChargeHours: string;
}

export function computeEvMetrics(user: User): EvMetrics {
  const { ev, ratePlans } = user;

  // Find the best TOU plan
  const best = ratePlans.find(p => p.id === 'etou-d') ?? ratePlans[0];
  const optimizedRate = best.avgRate * 0.6; // off-peak discount ~40%
  const optimizedMonthlyCost = parseFloat((ev.currentMonthlyKwh * optimizedRate).toFixed(2));
  const annualSavings = Math.round((ev.currentMonthlyCost - optimizedMonthlyCost) * 12);

  return {
    currentMonthlyCost: ev.currentMonthlyCost,
    optimizedMonthlyCost,
    annualSavings,
    bestPlan: best.name,
    bestPlanRate: optimizedRate,
    offPeakChargeHours: '9 PM – 4 PM',
  };
}

// ─── EV Report builder ──────────────────────────────────────────────────────
// Mirrors Figma 5600:11592 ("EV Report — EV-1: Standard Flat Rate") pixel-for-
// pixel. Uses USER's bill where it makes sense for "today" numbers. When the
// chat's EV flow has collected answers (miles/month, charge location, fuel
// economy, off-peak willingness), every dollar figure below is derived from
// them instead of the flat Figma defaults — that's what makes the report
// visibly react to what the user picked. With no inputs (report opened
// without running the flow), it falls back to the original fixed scenario
// so the numbers still match the design exactly.

const EV_DEFAULT_INPUTS: EvInputs = { milesPerMonth: 1200, charging: 'home', mpg: 28, offPeak: true };
const GAS_PRICE_PER_GALLON = 3.89; // GasBuddy, ZIP 94103 — held fixed across scenarios
const EV_EFFICIENCY_MI_PER_KWH = 3.5;
const EV_RATE_HOME_OFFPEAK = 0.08;  // $/kWh — E-TOU-C overnight window
const EV_RATE_HOME_ONPEAK  = 0.18;  // $/kWh — charging at home outside the off-peak window
const EV_RATE_PUBLIC       = 0.30;  // $/kWh — public DC fast-charging premium

export function buildEvReport(user: User, inputs?: EvInputs): Report {
  const { milesPerMonth, charging, mpg, offPeak } = inputs ?? EV_DEFAULT_INPUTS;
  const annualMiles = milesPerMonth * 12;

  // Today (gasoline car) costs
  const annualFuelCost      = Math.round((annualMiles / mpg) * GAS_PRICE_PER_GALLON);
  const annualHomeElecToday = 1560;   // current bill electric portion ×12 — unaffected by the EV Q&A
  const annualEvChargeToday = 0;
  const totalToday          = annualFuelCost + annualHomeElecToday + annualEvChargeToday;

  // With EV — charging cost depends on where + when the user charges
  const annualKwhForEv = annualMiles / EV_EFFICIENCY_MI_PER_KWH;
  const evRate =
    charging === 'public' ? EV_RATE_PUBLIC : offPeak ? EV_RATE_HOME_OFFPEAK : EV_RATE_HOME_ONPEAK;
  const annualFuelCostEv      = 0;
  const annualHomeElecEv      = charging === 'home' ? 1680 : 1560; // small daytime bump only when charging at home
  const annualEvCharge        = Math.round(annualKwhForEv * evRate);
  const totalEv               = annualFuelCostEv + annualHomeElecEv + annualEvCharge;

  const annualSavings   = totalToday - totalEv;
  const sevenYearTotal  = annualSavings * 7;

  // Rate-plan comparison (Figma 5581:5182) — independent of the totals above:
  // this section isolates the value of switching *rate plans* specifically,
  // assuming the EV is already in the driveway either way (charged at home,
  // on-peak flat rate vs the recommended EV time-of-use plan).
  const annualCostFlatWithEv   = Math.round(1560 + annualKwhForEv * EV_RATE_HOME_ONPEAK);
  const annualCostTouWithEv    = totalEv; // ties back to the EV-on-best-rate total above
  const annualCostTouShifted   = Math.round(totalEv * 0.92); // a bit more usage nudged into the cheapest window
  const ratePlanSwitchDelta    = annualCostTouShifted - annualCostFlatWithEv;

  // Bar chart segment colors
  const C_GASOLINE     = '#CE4257';   // Web/Red/600
  const C_EV_CHARGE    = '#00AB55';   // Web/Appliance/EV/700 (raw — DS ramp pending)
  const C_HOME_ELEC    = '#186CDD';   // Web/Primary/500
  const C_RED_DELTA    = '#CE4257';   // Web/Red/600 — for "+$N" cost-increase rows
  const C_GREEN_DELTA  = '#026B28';   // Web/Green/700 — for "−$N" savings rows

  return {
    id: `ev-report-${Date.now()}`,
    title: "Here's what switching to an EV looks like for you.",
    titleAccentWords: ['switching', 'to', 'an', 'ev'],
    titleAccentColor: '#14843C', // Web/Green/600 — EV brand identity
    subtitle: 'Based on one year of your actual driving and energy usage.',
    generatedAt: new Date().toISOString(),
    customer: {
      name: user.name,
      accountNumber: '#4421-09',
      address: user.address,
      zip: user.zip,
      date: 'April 14, 2026',
    },
    branding: { companyName: 'Energy Co', primaryColor: '#1d6cdb' },
    sections: [
      {
        type: 'kpi-row',
        kpis: [
          {
            label: 'ANNUAL SAVINGS',
            value: `$${annualSavings.toLocaleString()}`,
            subtext: 'Fuel + electricity',
            accent: 'green',
          },
          {
            label: '7-YEAR TOTAL',
            value: `$${sevenYearTotal.toLocaleString()}`,
            subtext: 'Projected operational savings',
            accent: 'blue',
          },
        ],
      },
      {
        type: 'cost-comparison-bar',
        title: 'ANNUAL COST COMPARISON',
        columns: [
          {
            label: 'With Gasoline Car',
            total: `$${totalToday.toLocaleString()}`,
            // Bottom-up: home electricity at the base, gasoline on top
            segments: [
              {
                label: 'Home electricity',
                value: annualHomeElecToday,
                displayValue: `$${annualHomeElecToday.toLocaleString()}`,
                color: C_HOME_ELEC,
              },
              {
                label: 'Gasoline',
                value: annualFuelCost,
                displayValue: `$${annualFuelCost.toLocaleString()}`,
                color: C_GASOLINE,
              },
            ],
          },
          {
            label: 'With EV',
            total: `$${totalEv.toLocaleString()}`,
            segments: [
              {
                label: 'Home electricity',
                value: annualHomeElecEv,
                displayValue: `$${annualHomeElecEv.toLocaleString()}`,
                color: C_HOME_ELEC,
              },
              {
                label: 'EV charging',
                value: annualEvCharge,
                displayValue: `$${annualEvCharge}`,
                color: C_EV_CHARGE,
              },
            ],
          },
        ],
        legend: [
          { label: 'Gasoline', color: C_GASOLINE },
          { label: 'EV charging', color: C_EV_CHARGE },
          { label: 'Home electricity', color: C_HOME_ELEC },
        ],
        insight:
          "Why does electricity go up slightly? We assumed an EV rate plan — it's cheapest overnight when your car charges, slightly pricier by day. The small daytime bump ($120/yr) is easy to make up by running laundry or the dishwasher after 10pm.",
      },
      {
        type: 'cost-breakdown',
        columns: ['GASOLINE CAR', 'WITH EV', 'CHANGE'],
        rows: [
          {
            label: 'Annual fuel cost',
            values: [`$${annualFuelCost.toLocaleString()}`, `$${annualFuelCostEv}`, `−$${annualFuelCost.toLocaleString()}`],
            valueColors: [undefined, undefined, C_GREEN_DELTA],
          },
          {
            label: 'Annual home electricity',
            values: [`$${annualHomeElecToday.toLocaleString()}`, `$${annualHomeElecEv.toLocaleString()}`, `+$${annualHomeElecEv - annualHomeElecToday}`],
            valueColors: [undefined, undefined, C_RED_DELTA],
          },
          {
            label: 'Annual EV charging',
            values: [`$${annualEvChargeToday}`, `$${annualEvCharge}`, `+$${annualEvCharge}`],
            valueColors: [undefined, undefined, C_RED_DELTA],
          },
        ],
        total: {
          label: 'Total',
          values: [`$${totalToday.toLocaleString()}`, `$${totalEv.toLocaleString()}`, `−$${annualSavings.toLocaleString()}`],
          valueColors: [undefined, undefined, C_GREEN_DELTA],
        },
      },
      {
        type: 'rate-plan',
        plans: [
          {
            label: 'YOUR CURRENT RATE PLAN',
            title: 'Standard Flat Rate',
            description:
              'This is your current electricity rate plan. If you charge your EV on this flat rate, you pay the same price whether you charge at 2pm or 2am — missing the cheaper overnight window.',
            importPeriods: [],
            usageChart: { variant: 'flat' },
            costRows: [
              { label: 'ANNUAL COST', value: `$${annualCostFlatWithEv.toLocaleString()}` },
            ],
          },
          {
            label: 'RECOMMENDED RATE PLAN',
            title: 'EV Time-of-Use Plan',
            description:
              'Based on our analysis, this plan is a better match for your EV charging patterns — prices drop sharply overnight, exactly when most EV charging happens.',
            importPeriods: [],
            usageChart: {
              variant: 'tou',
              segments: [
                { label: 'Off Peak', tone: 'off-peak', widthFr: 9, heightFr: 0.85 },
                { label: 'Mid Peak', tone: 'mid-peak', widthFr: 6, heightFr: 0.45 },
                { label: 'Peak',     tone: 'peak',      widthFr: 5, heightFr: 0.3 },
                { tone: 'off-peak',                     widthFr: 4, heightFr: 0.7 },
              ],
              timeLabels: ['12 AM', '9 AM', '3 PM', '8 PM', '12 AM'],
            },
            costRows: [
              { label: 'ANNUAL COST', value: `$${annualCostTouWithEv.toLocaleString()}` },
              {
                label: 'SHIFTED ANNUAL COST',
                value: `$${annualCostTouShifted.toLocaleString()}`,
                delta: `${ratePlanSwitchDelta > 0 ? '+' : '−'}$${Math.abs(ratePlanSwitchDelta).toLocaleString()}/yr`,
              },
            ],
            isRecommended: true,
          },
        ],
        // EV report doesn't need a separate export bar — the Figma omits it.
        exportPeriods: [],
      },
      {
        type: 'inputs',
        headline: 'YOUR INPUTS',
        assumptions: [
          { label: 'Monthly driving distance', value: `${milesPerMonth.toLocaleString()} miles/month` },
          { label: charging === 'home' ? 'Home charging' : 'Public charging', value: '100%' },
          { label: 'Current vehicle fuel economy', value: `${mpg} mpg` },
          { label: 'EV efficiency', value: `${EV_EFFICIENCY_MI_PER_KWH} mi/kWh` },
          { label: 'Off-peak charging', value: charging === 'home' ? (offPeak ? 'Yes' : 'No') : 'N/A' },
        ],
        secondaryLabel: 'ASSUMPTIONS:',
        secondaryChips: [
          { label: 'Gasoline price', value: `$${GAS_PRICE_PER_GALLON}/gal · ${user.zip}` },
        ],
      },
      {
        type: 'neighborhood',
        count: 8400,
        headline: 'Estimated EVs in your ZIP code',
        body: 'EV adoption is growing across your area.',
      },
      {
        type: 'faq',
        items: [
          { question: 'Does this include the cost of the car?', answer: 'No — these numbers cover only operating costs (fuel vs charging + electricity). Vehicle purchase, financing, and depreciation are separate.' },
          { question: 'Do I need a special charger at home?', answer: 'A standard 120V outlet works for overnight charging at this mileage. A Level-2 charger speeds things up but is not required.' },
          { question: 'What about long road trips?', answer: 'Public fast charging makes long trips workable, though it costs more per kWh than home charging. Plan stops along major highways.' },
          { question: 'What if electricity prices rise?', answer: "Even with rate increases, EV charging remains cheaper per mile than gasoline. The savings shrink but don't reverse." },
          { question: 'What about pairing with solar?', answer: 'Pairing solar with home EV charging can drive your effective fuel cost close to zero. Worth exploring once an EV is in your driveway.' },
          { question: 'Are there EV rebates or incentives available?', answer: 'Federal tax credits up to $7,500 may apply for new EVs and $4,000 for used EVs. State and utility rebates can stack on top.' },
          { question: 'Why do my EV simulation results vary between runs?', answer: 'Small variations come from rounding in real-time utility rate data and updated seasonal usage estimates. Each run reflects the latest meter readings, so minor differences are expected and don’t change the overall savings picture.' },
        ],
      },
      {
        type: 'cta-banner',
        headline: 'Switch when your EV arrives',
        subtext: 'energy.co/switch',
        buttonLabel: 'View switch steps',
        buttonUrl: 'https://energy.co/switch',
        variant: 'ev',
      },
    ],
    sources: [
      'GasBuddy (ZIP 94103)',
      'utility tariff filings',
      '12 months of actual meter readings',
    ],
  };
}

// ─── Rate Plan Comparison Report builder ──────────────────────────────────────
// Mirrors Figma 1476:10242 pixel-for-pixel. KPI tiles are text + dollar
// (recommended plan name + potential savings). The recommended-plan card
// uses two-row costRows (annual cost + annual cost with shifting) instead
// of the single Annual Savings row used by solar/EV. Includes a Small
// Tweaks grid and a Top Alternative Plans table.

export function buildRatePlanReport(user: User): Report {
  const annualToday   = 1890; // current Residential Flat Rate
  const annualPlanA   = 1820; // TOU Saver Plan A baseline
  const annualPlanAShift = 1470; // After 3 small load shifts
  const potentialSavings = annualToday - annualPlanAShift; // 420

  const C_RED_DELTA   = '#CE4257'; // Web/Red/600 — for "+$N" cost-increase rows
  const C_GREEN_DELTA = '#026B28'; // Web/Green/700 — for "−$N" savings rows

  return {
    id: `rate-plan-report-${Date.now()}`,
    title: "Based on your usage, here's the best rate plan.",
    titleAccentWords: ['best', 'rate', 'plan'],
    titleAccentColor: '#186CDD', // Web/Primary/500 — rate-plan domain blue
    subtitle:
      'We estimated your annual cost under each eligible plan and identified the lowest-cost option.',
    generatedAt: new Date().toISOString(),
    customer: {
      name: user.name,
      accountNumber: '#4421-09',
      address: user.address,
      zip: user.zip,
      date: 'April 14, 2026',
    },
    branding: { companyName: 'Energy Co', primaryColor: '#1d6cdb' },
    sections: [
      {
        type: 'kpi-row',
        kpis: [
          {
            label: 'RECOMMENDED PLAN',
            value: 'Rate Plan- 280',
            subtext: 'Switch from your current Rate Plan- 180',
            accent: 'green',
          },
          {
            label: 'POTENTIAL ANNUAL SAVINGS',
            value: `$${potentialSavings}`,
            subtext: 'with recommended plan with shifting',
            accent: 'green',
          },
        ],
      },
      {
        type: 'bar-comparison',
        title: 'ANNUAL BILL COMPARISON',
        items: [
          { label: 'Current Plan', value: annualToday, displayValue: `$${annualToday.toLocaleString()}`, color: '#186CDD' },
          {
            label: 'With Rate Plan- 280',
            value: annualPlanAShift,
            displayValue: `$${annualPlanAShift.toLocaleString()}`,
            color: '#5BD584',
            valueColor: '#026B28',
          },
        ],
      },
      {
        type: 'rate-plan',
        plans: [
          {
            label: 'YOUR CURRENT RATE PLAN',
            title: 'Rate Plan- 180',
            description:
              'This is your current electricity rate plan. It may not be the most cost-effective option for your energy usage.',
            importPeriods: [],
            usageChart: { variant: 'flat' },
            costRows: [
              { label: 'ANNUAL COST', value: `$${annualToday.toLocaleString()}` },
            ],
          },
          {
            label: 'RECOMMENDED RATE PLAN',
            title: 'Rate Plan- 280',
            description:
              'Based on our analysis of your energy usage, this plan is expected to provide the lowest annual electricity cost.',
            importPeriods: [],
            usageChart: {
              variant: 'tou',
              segments: [
                { label: 'Off Peak', tone: 'off-peak', widthFr: 9, heightFr: 0.85 },
                { label: 'Mid Peak', tone: 'mid-peak', widthFr: 6, heightFr: 0.5 },
                { label: 'Peak',     tone: 'peak',      widthFr: 5, heightFr: 0.9 },
                { tone: 'mid-peak',                     widthFr: 4, heightFr: 0.5 },
              ],
              timeLabels: ['12 AM', '9 AM', '3 PM', '8 PM', '12 AM'],
            },
            costRows: [
              { label: 'ANNUAL COST', value: `$${annualPlanA.toLocaleString()}` },
              {
                label: 'SHIFTED ANNUAL COST',
                subLabel: 'With usage shifted to lower-cost time windows',
                value: `$${annualPlanAShift.toLocaleString()}`,
                delta: `−$${potentialSavings}/yr`,
              },
            ],
            isRecommended: true,
          },
        ],
        // No export bar in the rate-plan report.
        exportPeriods: [],
      },
      {
        type: 'cta-banner',
        headline: 'Switch online and start saving',
        subtext: 'energy.co/rate-plan',
        buttonLabel: 'Switch to Recommended Rate Plan →',
        buttonUrl: 'https://energy.co/rate-plan',
        variant: 'rate',
      },
      {
        type: 'tweaks-grid',
        label: 'SMALL TWEAKS TO SAVE MORE',
        cards: [
          {
            title: 'Pre-cooling',
            icon: 'cooling',
            fromTime: 'Peak',
            toTime: 'Mid-Peak',
            toTone: 'mid-peak',
            description:
              'Cool your home before peak-priced hours begin, then let the temperature drift during peak-priced hours. Comfort barely changes — your bill does.',
            savings: '$117/yr',
          },
          {
            title: 'Shift Pool Pump',
            icon: 'pool',
            fromTime: 'Peak',
            toTime: 'Off-Peak',
            description:
              'Schedule the pump to run during lower-priced hours instead of peak-priced hours. One timer change, permanent savings.',
            savings: '$143/yr',
          },
          {
            title: 'Shift EV Charging',
            icon: 'ev',
            fromTime: 'Peak',
            toTime: 'Off-Peak',
            description:
              'Schedule charging to start during off-peak hours using your vehicle or charger app. Set it once & save every time you charge.',
            savings: '$90/yr',
          },
        ],
      },
      {
        type: 'alternative-plans-table',
        title: 'All Analysed Plans',
        costColumnLabel: 'ANNUAL COST (WITH SHIFTING)',
        deltaColumnLabel: 'VS CURRENT',
        rows: [
          {
            name: 'Rate Plan- 280',
            annualCost: `$${annualPlanAShift.toLocaleString()}`,
            vsToday: `−$${potentialSavings}`,
            vsTodayColor: C_GREEN_DELTA,
            isRecommended: true,
          },
          {
            name: 'TOU Saver Plan B',
            annualCost: '$1,620',
            vsToday: '−$270',
            vsTodayColor: C_GREEN_DELTA,
          },
          {
            name: 'EV Time-of-Use',
            annualCost: '$1,710',
            vsToday: '−$180',
            vsTodayColor: C_GREEN_DELTA,
          },
          {
            name: 'Residential Tiered Rate',
            annualCost: '$2,040',
            vsToday: '+$150',
            vsTodayColor: C_RED_DELTA,
          },
        ],
      },
    ],
  };
}

// ─── High Bill Explainer Report builder ───────────────────────────────────────
// Mirrors Figma 1476:9667 pixel-for-pixel. Three colored KPI tiles across the
// top, a 13-month trend bar chart with the current month highlighted, a
// driver-attribution card whose primary cause embeds a 30-day daily bar chart,
// numbered key insights, and a green "find more savings" CTA.

export function buildBillExplainerReport(user: User): Report {
  // Hardcoded narrative figures matching the Figma copy. The chat side
  // never reveals these — they're report-only.
  const thisCycle = 312;
  const lastMonth = 225;
  const lastApril = 284;
  const deltaMonth = thisCycle - lastMonth; // +87
  const deltaYear = thisCycle - lastApril;  // +28
  const pctMonth = ((deltaMonth / lastMonth) * 100).toFixed(1); // 38.7
  const pctYear  = ((deltaYear / lastApril) * 100).toFixed(1);  // 9.9

  return {
    id: `bill-report-${Date.now()}`,
    title: `Your bill this month is $${deltaMonth} higher than previous bill cycle — here's what drove it.`,
    titleAccentWords: [],
    subtitle:
      'We compared your bill with your previous bill cycle and the same period last year. We found your costs were significantly higher than your previous bill cycle.',
    generatedAt: new Date().toISOString(),
    customer: {
      name: user.name,
      accountNumber: '#4421-09',
      address: user.address,
      zip: user.zip,
      date: 'April 14, 2026',
    },
    branding: { companyName: 'Energy.Co', primaryColor: '#1d6cdb' },
    sections: [
      {
        type: 'bill-kpi-tiles',
        tiles: [
          {
            label: 'ANALYSED CYCLE',
            value: `$${thisCycle}`,
            subtext: 'Mar 12 – Apr 11, 2026',
            surface: 'blue',
          },
          {
            label: 'VS. PREVIOUS BILL CYCLE',
            value: `+$${deltaMonth}`,
            delta: `+${pctMonth}%`,
            subtext: `Previous bill cycle was $${lastMonth}`,
            surface: 'orange',
          },
          {
            label: 'VS. SAME TIME PREVIOUS YEAR',
            value: `+$${deltaYear}`,
            delta: `+${pctYear}%`,
            subtext: `Previous year was $${lastApril}`,
            surface: 'purple',
          },
        ],
      },
      {
        type: 'trend-bar-chart',
        label: 'USAGE HISTORY — LAST 13 MONTHS',
        rightCaption: 'Labels indicate the bill cycle end month.',
        points: [
          { label: 'Apr', value: 84, tone: 'purple', displayValue: `$${lastApril}` },
          { label: 'May', value: 92 },
          { label: 'Jun', value: 109 },
          { label: 'Jul', value: 121 },
          { label: 'Aug', value: 130 },
          { label: 'Sep', value: 114 },
          { label: 'Oct', value: 87 },
          { label: 'Nov', value: 72 },
          { label: 'Dec', value: 79, yearSuffix: '2025' },
          { label: 'Jan', value: 87, yearSuffix: '2026' },
          { label: 'Feb', value: 82 },
          { label: 'Mar', value: 66, tone: 'orange', displayValue: `$${lastMonth}` },
          { label: 'Apr', value: 92, tone: 'blue', displayValue: `$${thisCycle}`, boldLabel: true },
        ],
        legend: [
          { label: 'Same time Previous Year', tone: 'purple' },
          { label: 'Previous Bill Cycle', tone: 'orange' },
          { label: 'Analyzed Bill Cycle', tone: 'blue' },
        ],
      },
      {
        type: 'driver-breakdown',
        label: `Why $${deltaMonth} Up over previous bill cycle`,
        description:
          'The breakdown below focuses on the comparison to previous bill cycle because it represents the larger change in your bill.',
        groups: [
          {
            title: 'Non-Weather Consumption',
            dominant: true,
            description:
              'Always-on devices used 72 kWh more this cycle. Common sources include refrigerators, networking equipment, and standby electronics. Some of this usage may be reduced through small behavior changes.',
            amount: '+$41',
            rows: [
              { categoryIcon: 'heating', title: 'Heating', description: 'Heating used more energy than expected this cycle.', amount: '+$17' },
              { indent: true, title: 'Heating Runtime', description: 'Your heating system ran longer than expected this cycle.', amount: '+$10' },
              { indent: true, title: 'Heating Inefficiency', description: 'Reduced heater efficiency increased energy required to maintain comfort.', amount: '+$7' },
              { categoryIcon: 'always-on', title: 'Always-On', description: 'Devices that run continuously used more energy than expected, including networking equipment, standby electronics, and other always-on devices.', amount: '+$7' },
              { categoryIcon: 'ev', title: 'EV', description: 'Additional EV charging increased electricity consumption this cycle.', flag: 'Confirm you have an EV', amount: '+$5' },
              { categoryIcon: 'other', title: 'Other', description: 'Smaller increases across several appliances added to your bill.', amount: '+$12' },
            ],
          },
          {
            title: 'Weather-Driven Consumption',
            description:
              'Average outdoor temperatures were 6°F higher this cycle. Our analysis estimates weather-driven cooling demand contributed approximately 32 kWh of additional AC consumption.',
            amount: '+$11',
            rows: [
              { secondary: true, title: 'Heating', description: 'Average outdoor temperatures were 6°F lower than the previous billing cycle, increasing heating demand.', amount: '+$11' },
            ],
          },
          {
            title: 'Rate-Driven',
            description:
              'Your rate plan changed this cycle, and your average rate went from 18¢ to 21¢ per kWh. We estimate this change increased your bill by about $20.',
            amount: '+$24',
            rows: [
              { title: 'Peak Consumption Increase', description: 'More electricity was used during peak-priced hours than expected, increasing your bill.', amount: '+$24' },
              { indent: true, title: 'Heating', description: 'A larger share of heating usage occurred during peak-priced hours.', amount: '+$11' },
              { indent: true, title: 'EV', description: 'More charging occurred during higher-priced evening hours.', amount: '+$7' },
              { indent: true, title: 'Pool-Pump', description: 'Pump operation shifted toward peak-priced periods.', flag: 'Confirm you have a Pool Pump', amount: '+$4' },
              { indent: true, title: 'Other', description: 'Smaller increases across several appliances added to peak-hour consumption.', amount: '+$2' },
            ],
          },
          {
            title: 'Consumption days',
            description: 'Factors related to your billing period and consumption patterns that affected your bill.',
            amount: '+$11',
            rows: [
              { title: 'Bill Cycle days', description: 'One extra day in this billing cycle (30 vs. 29 days). This difference is due to billing period length, not higher energy usage.', amount: '+$6' },
              { title: 'Low consumption days', description: 'Previous months have 2 more low consumption day than this month', amount: '+$5' },
            ],
          },
        ],
      },
    ],
  };
}

// ─── Home Bill Optimiser Report builder ───────────────────────────────────────
// Mirrors the Home Optimizer reference export pixel-for-pixel: a 2-tile hero
// (bill + savings potential), a standalone bill-breakdown donut, a "What's
// Included" summary, a 5-category Energy Efficiency deep-dive (Cooling,
// Heating, Always-On, Pool Pump, Water Heating), a Rate Plan Optimization
// card, and an FAQ.
//
// Internal-math invariant: $672 (efficiency) + $420 (rate plan) = $1,092
// (headline annual savings potential). Donut categories sum to $2,640.

export function buildOptimizerReport(user: User): Report {
  return {
    id: `optimizer-report-${Date.now()}`,
    title: 'Home Optimizer Report',
    titleAccentWords: [],
    subtitle:
      'This report breaks down where your energy is being used and provides personalized recommendations to help lower future bills. Explore each section to identify the biggest opportunities for savings.',
    generatedAt: new Date().toISOString(),
    customer: {
      name: user.name,
      accountNumber: '#4421-09',
      address: user.address,
      zip: user.zip,
      date: 'April 14, 2026',
    },
    branding: { companyName: 'Energy.Co', primaryColor: '#1d6cdb' },
    sections: [
      {
        type: 'kpi-row',
        hideEllipse: true,
        kpis: [
          { label: 'YOUR ANNUAL BILL', value: '$2,640', subtext: 'Last 12 months', accent: 'blue' },
          { label: 'ANNUAL SAVINGS POTENTIAL', value: '$1,092', subtext: '', accent: 'green', shadow: true },
        ],
      },
      {
        type: 'bill-donut',
        title: 'BILL BREAKDOWN IN LAST 12 MONTHS',
        centerLabel: '$2,640',
        slices: [
          { label: 'Cooling', value: 920, displayValue: '$920', color: '#3794FC' },
          { label: 'Water heating', value: 505, displayValue: '$505', color: '#FF7A00' },
          { label: 'EV charging', value: 480, displayValue: '$480', color: '#72FFB8' },
          { label: 'Always-on baseload', value: 395, displayValue: '$395', color: '#A9A9F5' },
          { label: 'Heating', value: 270, displayValue: '$270', color: '#F83E16' },
          { label: 'Other Appliances', value: 250, displayValue: '$250', color: '#606F89' },
          { label: 'Tax and other charges', value: 90, displayValue: '$90', color: '#CCCCCC' },
        ],
      },
      {
        type: 'whats-included',
        title: "What's Included in This Report",
        description:
          'This report identifies opportunities to reduce your energy bill through efficiency improvements and rate plan optimization..',
        cards: [
          {
            icon: 'leaf',
            title: 'Energy Efficiency',
            description: 'Reduce energy waste across cooling, heating, water heating, Pool Pumps, and always-on devices.',
            savingsLabel: 'Potential savings',
            savingsAmount: '$672/year',
          },
          {
            icon: 'price-tag',
            title: 'Rate Plan Optimization',
            description: 'Find the best rate plan for your energy use and ways to lower costs during peak hours.',
            savingsLabel: 'Potential savings',
            savingsAmount: '$420/year',
          },
        ],
      },
      {
        type: 'efficiency-deepdive',
        bannerTitle: 'Energy Efficiency · Save up to $672/year',
        bannerDescription:
          "We've identified opportunities across Cooling, Heating, and Always-On energy use that could save you up to $672/year.",
        categories: [
          {
            icon: 'cooling',
            label: 'COOLING',
            subtitle: 'Your AC runs about 12 hrs/day— higher than expected.',
            blocks: [
              { kind: 'hourly-chart', color: '#3794FC' },
              { kind: 'callout', title: 'Reduce AC runtime by up to 2–3 hours/day', description: 'Reducing unnecessary cooling during occupied hours may lower cooling costs while maintaining comfort.', amount: 'saves $90' },
              {
                kind: 'setpoint',
                title: 'Your Cooling set point is lower than recommended',
                lowerLabel: 'Lower Set Point ($$$)',
                higherLabel: 'Higher Set Point ($)',
                thumbPct: 0.17,
                callout: { kind: 'callout', title: 'Increase your set point by 2°F → save approximately 3–4% cooling bill', description: 'A small increase in your cooling set point can reduce AC runtime and lower cooling costs. For many homes, a 2°F adjustment is comfortable and can save approximately 3–4% on cooling expenses.', amount: 'saves $90' },
              },
              {
                kind: 'saturation',
                subtitle: 'Your AC shows signs of reduced efficiency',
                title: 'Saturation Detected',
                description: 'Your AC is running near maximum capacity during hot periods but is unable to maintain the desired indoor temperature.',
                chartImage: '/optimizer/saturation_cooling.png',
                causes: ['Airflow restrictions', 'Equipment wear', 'Maintenance issues', 'Duct leakage', 'HVAC sizing', 'Insulation losses'],
              },
              { kind: 'cta-technician', title: 'Schedule a technician review', description: 'Schedule an HVAC inspection to identify and address potential efficiency issues that may be increasing cooling costs.', linkLabel: 'Check Available Services', savingsLabel: 'saves upto $80' },
            ],
          },
          {
            icon: 'heating',
            label: 'HEATING',
            subtitle: 'Your Heating runs about 12 hrs/day— higher than expected.',
            blocks: [
              { kind: 'hourly-chart', color: '#F83E16' },
              { kind: 'callout', title: 'Reduce Heating runtime by ~2–3 hours/day', description: 'Reducing unnecessary heating runtime can lower heating costs while maintaining comfort.', amount: 'saves $90' },
              {
                kind: 'setpoint',
                title: 'Your Heating set point is higher than recommended',
                lowerLabel: 'Lower Set Point ($)',
                higherLabel: 'Higher Set Point ($$$)',
                thumbPct: 0.71,
                callout: { kind: 'callout', title: 'Lower set point by 2°F → save approximately 3–4% on heating costs', description: 'A small reduction in your heating set point can reduce heating runtime and lower energy costs. For many homes, lowering the thermostat by 2°F remains comfortable and can save approximately 3–4% on heating.', amount: 'saves $90' },
              },
              {
                kind: 'saturation',
                subtitle: 'Your Heating system shows signs of reduced efficiency',
                title: 'Saturation Detected',
                description: 'Your heating system runs at maximum capacity but struggles to maintain indoor temperature during colder periods. This may indicate insufficient capacity, airflow restrictions, or insulation issues.',
                chartImage: '/optimizer/saturation_heating.png',
                causes: ['Airflow restrictions', 'Equipment wear', 'Maintenance issues', 'Duct leakage', 'HVAC sizing', 'Insulation losses'],
              },
              { kind: 'cta-technician', title: 'Schedule a technician review', description: 'Have your system inspected to identify common efficiency issues such as airflow restrictions, equipment wear, or insulation-related losses.', linkLabel: 'Check Available Services', savingsLabel: 'saves upto $80' },
            ],
          },
          {
            icon: 'always-on',
            label: 'ALWAYS ON',
            subtitle: 'Your Always-On usage is more than the typical home',
            subtitleNote: "These are appliances drawing power 24/7, even when you're not home.",
            blocks: [
              { kind: 'bar-compare', rows: [
                { label: 'Typical usage', displayValue: '$200/year', widthPct: 0.39, tone: 'green' },
                { label: 'Your Usage', displayValue: '$395/year', widthPct: 0.78, tone: 'orange' },
              ]},
              { kind: 'chips', title: 'Common Sources of Always-On Usage', items: ['Cable box / DVR', 'Router / Modem', 'Gaming console (standby)', 'Smart TV (standby)', 'Idle chargers & adapters', 'Desktop / laptop (sleep)'] },
              {
                kind: 'green-list',
                title: 'Recommended actions',
                amount: 'saves $90/yr',
                items: [
                  { title: 'Smart power strip on entertainment stack', description: 'Cuts standby on TV, console, peripherals' },
                  { title: 'Turn off TVs, consoles & peripherals when not in use', description: 'Cuts standby power from entertainment devices' },
                  { title: 'Unplug idle chargers & desktops', description: 'Load that run 24/7' },
                ],
              },
            ],
          },
          {
            icon: 'pool-pump',
            label: 'POOL PUMP',
            subtitle: 'Your Pool Pump may be running longer than typical homes',
            blocks: [
              { kind: 'bar-compare', rows: [
                { label: 'Typical usage', displayValue: '~8 hours/day', widthPct: 0.39, tone: 'green' },
                { label: 'Your Usage', displayValue: '~12 hours/day', widthPct: 0.78, tone: 'orange' },
              ]},
              { kind: 'callout', title: 'Reduce Pool Pump Runtime by ~10–15%', description: 'Reducing unnecessary runtime can lower Pool Pump costs', amount: 'saves $195' },
              { kind: 'confirm-flag', label: 'Confirm you have a Pool Pump' },
            ],
          },
          {
            icon: 'water-heating',
            label: 'WATER HEATING',
            subtitle: 'You have opportunities to reduce Water Heating costs',
            blocks: [
              {
                kind: 'green-list',
                title: 'Recommended Behavior actions',
                description: 'Reflects your opportunity to save by reducing direct hot water usage, based on a comparison with typical homes.',
                amount: 'saves $35/yr',
                items: [
                  { title: 'Lower water heater temperature', description: 'Reduce standby heat loss while maintaining comfort.', hasArrow: true },
                  { title: 'Reduce hot water usage by ~20%', description: 'Shorter showers and cold-water laundry can lower water heating costs.', hasArrow: true },
                ],
              },
              {
                kind: 'green-list',
                title: 'Recommended Upgrades',
                description: "Reflects your opportunity to save by reducing heat loss from your water heater when it's not in use, through better insulation or a more efficient system, relative to similar homes.",
                amount: 'saves $55/yr',
                items: [
                  { title: 'Install low-flow showerheads', description: 'Use less hot water without significantly affecting shower performance.', hasArrow: true },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'rate-plan',
        header: {
          icon: 'price-tag',
          title: 'Rate Plan Optimization · Save up to $420/year',
          description: "We've identified a rate plan that better matches your usage and could save up to $420/year with a few simple schedule changes.",
        },
        plans: [
          {
            label: 'YOUR CURRENT RATE PLAN',
            title: 'Rate Plan- 180',
            description: 'This is your current electricity rate plan. It may not be the most cost-effective option for your energy usage.',
            importPeriods: [],
            usageChart: { variant: 'flat' },
            costRows: [{ label: 'ANNUAL COST', value: '$1,890' }],
          },
          {
            label: 'RECOMMENDED RATE PLAN',
            title: 'Rate Plan- 280',
            description: 'Based on our analysis of your energy usage, this plan is expected to provide the lowest annual electricity cost.',
            importPeriods: [],
            usageChart: {
              variant: 'tou',
              segments: [
                { label: 'Off Peak', tone: 'off-peak', widthFr: 9, heightFr: 0.85 },
                { label: 'Mid Peak', tone: 'mid-peak', widthFr: 6, heightFr: 0.5 },
                { label: 'Peak',     tone: 'peak',      widthFr: 5, heightFr: 0.9 },
                { tone: 'mid-peak',                     widthFr: 4, heightFr: 0.5 },
              ],
              timeLabels: ['12 AM', '9 AM', '3 PM', '8 PM', '12 AM'],
            },
            costRows: [
              { label: 'ANNUAL COST', value: '$1,820' },
              { label: 'SHIFTED ANNUAL COST', subLabel: 'With usage shifted to lower-cost time windows', value: '$1,470', delta: '−$420/yr' },
            ],
            isRecommended: true,
          },
        ],
        exportPeriods: [],
      },
      {
        type: 'cta-banner',
        headline: 'Switch online and start saving',
        subtext: 'energy.co/switch',
        buttonLabel: 'Switch to Recommended Plan →',
        buttonUrl: 'https://energy.co/switch',
        variant: 'rate',
      },
      {
        type: 'faq',
        items: [
          { question: 'What are "typical homes"?', answer: 'Typical homes are homes with similar characteristics and energy usage patterns in your area. They provide a benchmark to help you understand how your energy use compares to similar households.' },
          { question: 'What is Always-On energy use?', answer: "Always-On energy use is the electricity consumed by devices that run continuously or remain powered even when you're not actively using them." },
          { question: 'What appliances contribute to Always-On usage?', answer: 'Common contributors include refrigerators, networking equipment (modems and routers), security systems, standby electronics, smart home devices, and other equipment that remains powered throughout the day.' },
          { question: 'What does Saturation Detected mean?', answer: 'Saturation means your heating or cooling system is running near its maximum capacity for extended periods but may still be struggling to maintain your desired indoor temperature. This can indicate opportunities to improve system performance or home efficiency.' },
          { question: 'What does Short Cycling Detected mean?', answer: 'Short cycling occurs when a heating or cooling system turns on and off more frequently than expected. Frequent cycling can reduce efficiency, increase equipment wear, and may indicate an issue worth investigating.' },
        ],
      },
    ],
  };
}

// buildOptimizerReportV2 — the "Analyse my latest bill" report. Same
// appliance deep-dive + rate-plan sections as buildOptimizerReport, but this
// customer is already on their best rate plan and has capital-investment
// upgrades worth surfacing, so the summary card gains a third column and a
// new "Small Tweaks" + "Capital Investments" pair of sections appears after
// the rate-plan CTA. Per Figma 5401:4027 (HBO2).
export function buildOptimizerReportV2(user: User): Report {
  const base = buildOptimizerReport(user);
  const donutSection = base.sections.find((s) => s.type === 'bill-donut')!;
  const efficiencySection = base.sections.find((s) => s.type === 'efficiency-deepdive')!;
  const ratePlanSection = base.sections.find((s) => s.type === 'rate-plan')!;
  const ctaSection = base.sections.find((s) => s.type === 'cta-banner')!;
  const faqSection = base.sections.find((s) => s.type === 'faq')!;

  return {
    ...base,
    id: `optimizer-v2-report-${Date.now()}`,
    sections: [
      {
        type: 'kpi-row',
        hideEllipse: true,
        kpis: [
          { label: 'YOUR ANNUAL BILL', value: '$2,640', subtext: 'Last 12 months', accent: 'blue' },
          { label: 'ANNUAL SAVINGS POTENTIAL', value: '$1,092', subtext: 'and up to $2,100/yr more with capital investments', accent: 'green', shadow: true },
        ],
      },
      donutSection,
      {
        type: 'whats-included',
        title: "What's Included in This Report",
        description:
          'This report identifies opportunities to reduce your energy bill through efficiency improvements, rate plan optimization, and long-term home upgrades.\nCapital investment savings are shown separately from annual savings totals.',
        cards: [
          {
            icon: 'leaf',
            title: 'Energy Efficiency',
            description: 'Reduce energy waste across cooling, heating, water heating, Pool Pumps, and always-on devices.',
            savingsLabel: 'Potential savings',
            savingsAmount: '$672/year',
          },
          {
            icon: 'price-tag',
            title: 'Rate Plan Optimization',
            description: "We analyzed available rate plans and confirmed you're already on the most cost-effective option.",
            savingsLabel: 'Status',
            savingsAmount: '✓ Already optimized',
          },
          {
            icon: 'bar-chart',
            title: 'Capital Investments',
            description: 'Explore home upgrades, programs, and equipment improvements for long-term savings.',
            savingsLabel: 'Potential savings',
            savingsAmount: '$2,100/year',
          },
        ],
      },
      efficiencySection,
      ratePlanSection,
      ctaSection,
      {
        type: 'tweaks-grid',
        label: 'SMALL TWEAKS TO SAVE MORE',
        cards: [
          {
            icon: 'cooling',
            title: 'Pre-cooling',
            fromTime: 'Peak',
            toTime: 'Mid-Peak',
            toTone: 'mid-peak',
            description: 'Cool your home before peak-priced hours begin, then let the temperature drift during peak-priced hours. Comfort barely changes — your bill does.',
            savings: '$117/yr',
          },
          {
            icon: 'pool',
            title: 'Shift Pool Pump',
            fromTime: 'Peak',
            toTime: 'Off-Peak',
            description: 'Schedule the pump to run during lower-priced hours instead of peak-priced hours. One timer change, permanent savings.',
            savings: '$143/yr',
          },
          {
            icon: 'ev',
            title: 'Shift EV Charging',
            fromTime: 'Peak',
            toTime: 'Off-Peak',
            description: 'Schedule charging to start during off-peak hours using your vehicle or charger app. Set it once & save every time you charge.',
            savings: '$90/yr',
          },
        ],
      },
      {
        type: 'capital-actions',
        icon: 'bar-chart',
        label: 'Capital Investments • Save Up to $2,100/year',
        description: 'Explore home upgrades that can reduce energy costs and improve efficiency over time.',
        cards: [
          {
            icon: 'thermometer',
            title: 'Smart Thermostat Installation',
            description: 'Your cooling usage is higher than similar homes, especially during peak hours. A smart thermostat can automate pre-cooling and scheduling to help reduce costs.',
            stats: [
              { label: 'Investment', value: '~$150–300' },
              { label: 'Payback', value: '2–3 yrs' },
              { label: 'Potential savings', value: '$120/yr', tone: 'savings' },
            ],
            ctaLabel: 'Check Utility Rebates',
          },
          {
            icon: 'pool-pump',
            title: 'Variable-speed Pool Pump',
            description: 'Your Pool Pump energy costs are higher than typical homes with a pool. A variable-speed pump may reduce operating costs by matching pump speed to actual demand.',
            stats: [
              { label: 'Investment', value: '~$800–1,400' },
              { label: 'Payback', value: '8–12 yrs' },
              { label: 'Estimated savings¹', value: 'Up to $450/yr', tone: 'savings' },
            ],
            footnote: '¹ Based on ENERGY STAR® estimates for standard in-ground Pool Pumps. Actual savings vary by pool type, pump size, runtime, and electricity rates.',
          },
          {
            icon: 'heating',
            title: 'Heat Pump Upgrade',
            description: 'Replace gas furnace or resistance heating with a heat pump — 2–3× more efficient than conventional systems.',
            stats: [
              { label: 'Investment', value: '~$4,000–8,000' },
              { label: 'Payback', value: '7–10 yrs' },
              { label: 'Potential savings', value: '$400/yr', tone: 'savings' },
            ],
          },
          {
            icon: 'solar',
            title: 'Rooftop Solar — 8.4 kW',
            description: 'Solar can significantly reduce electricity costs and may improve the economics of other energy upgrades. See your Solar report for details.',
            stats: [
              { label: 'Investment', value: '~$12,900 net' },
              { label: 'Payback', value: '6.1 yrs' },
              { label: 'Potential savings', value: '$2,100/yr', tone: 'savings' },
            ],
            ctaLabel: 'Get Solar Report',
          },
        ],
      },
      faqSection,
    ],
  };
}
