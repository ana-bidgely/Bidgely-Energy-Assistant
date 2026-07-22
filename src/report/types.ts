// ─── Report Data Schema ─────────────────────────────────────────────────────
// One source of truth for all renderers (web + PDF).
// Adding a new section: add a variant here, then handle it in each renderer's
// switch statement. That's the only required change.

export interface CustomerInfo {
  name: string;
  accountNumber: string;
  address: string;
  zip: string;
  date: string; // ISO 8601
}

export interface BrandingInfo {
  logoUrl?: string;
  companyName: string;
  primaryColor: string; // hex
}

// ─── KPI Section ─────────────────────────────────────────────────────────────

export type KpiAccent = 'green' | 'purple' | 'blue' | 'yellow';

export interface KpiCard {
  label: string;
  value: string;
  subtext: string;
  accent: KpiAccent;
  iconUrl?: string;
  /** Drop shadow on this tile (Web card-shadow). Defaults to no shadow. */
  shadow?: boolean;
}

export interface KpiRowSection {
  type: 'kpi-row';
  kpis: KpiCard[];
  /** Suppress the decorative corner ellipse on every tile. Used by the Home Optimizer report. */
  hideEllipse?: boolean;
}

// ─── Bar Comparison Chart ─────────────────────────────────────────────────────
// Two bars, e.g. "Today vs With Solar"

export interface BarComparisonItem {
  label: string;
  value: number;
  displayValue: string;
  color: string; // hex — bar fill
  /** Value-label text color for non-max items. Defaults to Web/Green/600 (#14843C). */
  valueColor?: string;
}

export interface BarComparisonSection {
  type: 'bar-comparison';
  title: string;
  items: BarComparisonItem[];
  yAxisLabel?: string;
}

// ─── Monthly Grouped Bar Chart ────────────────────────────────────────────────

export interface MonthlyDataPoint {
  month: string; // 'Jan', 'Feb', etc.
  consumption: number;
  generation: number;
}

export interface MonthlyChartSection {
  type: 'monthly-chart';
  title: string;
  data: MonthlyDataPoint[];
  yMax: number;
  yUnit: string;
  series: { consumptionLabel: string; generationLabel: string };
  insight?: string;
}

// ─── System Recommendation ───────────────────────────────────────────────────

export interface SystemFinancial {
  label: string;
  value: string;
  subtext: string;
  highlight?: boolean;
}

export interface SystemRecommendationSection {
  type: 'system-recommendation';
  label: string;
  sizeKw: number;
  panelCount: number;
  roofSqFt: number;
  whySizeBody: string;
  financials: SystemFinancial[];
  iconUrl?: string;
}

// ─── Size Comparison Table ────────────────────────────────────────────────────

export interface SizeOption {
  label: string;
  subtext: string;
  netCost: string;
  payback: string;
  verdict: string;
  isRecommended?: boolean;
}

export interface SizeComparisonSection {
  type: 'size-comparison';
  options: SizeOption[];
  /** Centered caption below the table, e.g. "Modeled at the maximum installable capacity of 25 kW". */
  caption?: string;
}

// ─── Hourly Profile (solar) ────────────────────────────────────────────────────
// Tabbed usage/generation chart (Figma solar report "HOURLY PROFILE"). The
// area-chart layers are pre-rendered illustrative SVGs (ported verbatim from
// the design export) rather than data-driven paths — this section is a
// presentational snapshot of a representative day, not a live computation.

export interface HourlyProfileKpi {
  label: string;
  value: string;
  tone: 'solar' | 'usage' | 'green';
}

export interface HourlyProfileSection {
  type: 'hourly-profile';
  label: string; // "HOURLY PROFILE"
  tabs: string[]; // e.g. ['Hourly avg', 'Weekday vs Weekend', 'Weekly totals'] — first is active
  months: string[]; // 12 short month labels
  activeMonth: string;
  subtext: string; // "Average day in Jun - hour by hour"
  kpis: HourlyProfileKpi[]; // 4 tiles
  yAxisLabels: string[]; // top-to-bottom, e.g. ['6000W','3000W','0W','-3000W','-6000W']
  xAxisLabels: string[]; // e.g. ['12am','2am',...,'10pm']
  legend: { label: string; swatch: 'orange' | 'blue' | 'green' }[];
  footerNotes: string[]; // e.g. ['☀️ Solar peaks midday', ...] — emoji already inline
}

// ─── Rate Plan Comparison ─────────────────────────────────────────────────────

export interface RatePeriod {
  timeRange: string;
  /**
   * Price tier. `$` = off-peak, `$$` = mid-peak, `$$$` = on-peak. `flat`
   * is used for non-TOU plans where the bar is a single neutral segment
   * (no time-of-use ramp).
   */
  tier: '$' | '$$' | '$$$' | 'flat';
  widthFr: number; // flex proportion
}

export interface RatePlanCostRow {
  /** Label, e.g. "Annual cost" or "Annual Cost with shifting" */
  label: string;
  /** Small caption under the label, e.g. "With usage shifted to lower-cost time windows". */
  subLabel?: string;
  /** Value, e.g. "$1,820" */
  value: string;
  /**
   * Optional delta caption (e.g. "−$420/yr") rendered under the value in
   * Web/Green/600. Used by the rate-plan report's "with shifting" row.
   */
  delta?: string;
}

// ─── Rate Usage Chart (alternative to the RateBar pill) ───────────────────────
// Used by the EV report's rate-plan cards (Figma 5581:5182): a flat-rate card
// shows a single flat usage band against a $/$$/$$$ axis; a TOU card shows
// colored off/mid/peak usage segments. Set on RatePlanCard.usageChart to
// render this INSTEAD of the standard "IMPORT (YOU BUY FROM GRID)" pill bar.

export interface RateUsageChartFlat {
  variant: 'flat';
}

export interface RateUsageChartTouSegment {
  /** Label rendered above the segment (e.g. "Off Peak"). Omit for unlabeled filler segments. */
  label?: string;
  tone: 'off-peak' | 'mid-peak' | 'peak';
  widthFr: number; // relative width — time span
  heightFr: number; // 0..1 relative bar height — usage volume
}

export interface RateUsageChartTou {
  variant: 'tou';
  segments: RateUsageChartTouSegment[];
  timeLabels: string[]; // x-axis labels, evenly spaced, e.g. ['12 AM','9 AM','3 PM','8 PM','12 AM']
}

export type RateUsageChart = RateUsageChartFlat | RateUsageChartTou;

export interface RatePlanCard {
  label: string;
  title: string;
  description: string;
  importPeriods: RatePeriod[];
  /**
   * When present, renders in place of the standard import pill bar (and its
   * "IMPORT (YOU BUY FROM GRID)" label). Used by the EV report.
   */
  usageChart?: RateUsageChart;
  /**
   * Annual savings or annual cost — for backwards compat with the solar
   * report. New reports should use `costRows` instead, which supports
   * multiple labelled rows separated by a divider.
   */
  annualSavings?: string;
  annualSavingsDelta?: string;
  /**
   * Multi-row cost section (rate-plan report). When present, replaces the
   * single annualSavings row. First row renders above the divider, second
   * below it.
   */
  costRows?: RatePlanCostRow[];
  insight?: string;
  isRecommended?: boolean;
}

export interface ExportRatePeriod {
  timeRange: string;
  rate: string;
  widthFr: number;
  /**
   * Optional tier — when present, the segment is filled with the matching
   * tier color (off_peak / mid_peak / on_peak) so the export bar reads in
   * the same ramp as the import bars. When absent, the segment falls back
   * to a neutral background and `isHighlight` controls the amber accent.
   */
  tier?: '$' | '$$' | '$$$';
  isHighlight?: boolean;
}

export interface RatePlanSection {
  type: 'rate-plan';
  /** Optional icon + h2 + description header above the plan cards (Home Optimizer report). */
  header?: { icon: 'price-tag' | 'leaf'; title: string; description: string };
  plans: RatePlanCard[];
  exportPeriods: ExportRatePeriod[];
  exportNote?: string;
}

// ─── Inputs / Assumptions Block ───────────────────────────────────────────────

export interface AssumptionChip {
  icon?: string;
  label: string;
  value: string;
}

export interface InputsSection {
  type: 'inputs';
  headline: string; // e.g. "You want to maximize savings." or "YOUR INPUTS"
  /**
   * Narrative sentence under the headline. Omit for the EV report's two-row
   * chip layout (Figma 5346:41091), which has no body sentence at all.
   */
  bodyParts?: Array<{ text: string; bold?: boolean }>;
  assumptions: AssumptionChip[];
  /** Label above the `assumptions` chips. Only rendered when bodyParts is present. Defaults to "PLUS A FEW ASSUMPTIONS". */
  assumptionsLabel?: string;
  /** Second chip row (e.g. "ASSUMPTIONS:" — gasoline price). Only used when bodyParts is omitted. */
  secondaryLabel?: string;
  secondaryChips?: AssumptionChip[];
}

// ─── Neighborhood Stat ────────────────────────────────────────────────────────

export interface NeighborhoodSection {
  type: 'neighborhood';
  count: number;
  headline: string;
  body: string;
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSection {
  type: 'faq';
  items: FaqItem[];
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

export interface CtaBannerSection {
  type: 'cta-banner';
  /**
   * Optional eyebrow label rendered above the headline in 12/16 SemiBold.
   * Used by the High Bill report's "NEXT STEPS" CTA. Omit for solar/EV.
   */
  label?: string;
  headline: string;
  subtext: string;
  buttonLabel: string;
  buttonUrl: string;
  /**
   * Visual variant.
   * - 'solar' (default): Web/Appliance/Solar/100 surface + Solar/700 button
   * - 'ev'             : raw mint #B7F6D8 surface + Web/Green/600 button
   * - 'rate'           : Web/Green/200 surface + Web/Green/600 button (rate
   *                      plan report's "Switch online and start saving")
   */
  variant?: 'solar' | 'ev' | 'rate';
}

// ─── Tweaks Grid (3 cards) ────────────────────────────────────────────────────
// Used by the rate-plan report's "SMALL TWEAKS TO SAVE MORE" section. Each
// card represents a behavioral shift (e.g. pre-cooling, pool pump timing)
// with a from/to time chip pair and an annual savings value.

export interface TweakCard {
  /** Title — e.g. "Pre-cooling" */
  title: string;
  /** Icon name (we render a built-in SVG by key, e.g. "cooling", "pool", "ev") */
  icon: 'cooling' | 'pool' | 'ev' | 'water-heating' | 'laundry' | 'cooking';
  /** "Before" window, e.g. "Peak" — rendered as a red error chip */
  fromTime: string;
  /** "After" window, e.g. "Off-Peak" or "Mid-Peak" */
  toTime: string;
  /** Color tone for the "to" chip. 'off-peak' (default) = green; 'mid-peak' = amber. */
  toTone?: 'off-peak' | 'mid-peak';
  /** Body explanation. */
  description: string;
  /** Annual savings, e.g. "$117/yr" */
  savings: string;
}

export interface TweaksGridSection {
  type: 'tweaks-grid';
  label: string;       // section title, e.g. "SMALL TWEAKS TO SAVE MORE"
  cards: TweakCard[];
}

// ─── Alternative Plans Table ──────────────────────────────────────────────────
// Used by the rate-plan report. 3-row table comparing other rate plans
// against today, with a verdict explanation.

export interface AlternativePlanRow {
  name: string;        // e.g. "TOU Saver Plan B"
  annualCost: string;  // e.g. "$1,620"
  vsToday: string;     // e.g. "−$270" or "+$150"
  /**
   * Color override for vsToday. Negative deltas in Web/Green/700,
   * positive in Web/Red/600 — chosen by the data layer.
   */
  vsTodayColor?: string;
  /** Explanation paragraph. Renders a 4th "VERDICT" column only when at least one row sets this. */
  verdict?: string;
  /** Green "Recommended" pill next to the plan name. */
  isRecommended?: boolean;
}

export interface AlternativePlansTableSection {
  type: 'alternative-plans-table';
  /** Card title, e.g. "All Analysed Plans" — rendered as an h2, not an eyebrow label. */
  title: string;
  /** Defaults to "ANNUAL COST". */
  costColumnLabel?: string;
  /** Defaults to "VS TODAY". */
  deltaColumnLabel?: string;
  rows: AlternativePlanRow[];
}

// ─── Cost Comparison (stacked bar) ────────────────────────────────────────────
// Two columns side-by-side, each a stacked bar with category segments. Used
// by the EV report ("With Gasoline Car" vs "With EV"). Per-column total is
// shown above the bar; segment dollars are shown inside each segment.

export interface CostComparisonSegment {
  label: string;        // legend label, e.g. "Gasoline"
  value: number;        // numeric for height proportion
  displayValue: string; // text shown inside the segment, e.g. "$2,000"
  color: string;        // hex
}

export interface CostComparisonColumn {
  label: string;             // x-axis label, e.g. "With Gasoline Car"
  total: string;             // displayed above the bar, e.g. "$3,560"
  segments: CostComparisonSegment[]; // bottom-up: first segment sits at the base
}

export interface CostComparisonBarSection {
  type: 'cost-comparison-bar';
  title: string;
  columns: CostComparisonColumn[];
  legend: { label: string; color: string }[];
  /** Optional surface-tinted callout below the chart (Web/Primary/200). */
  insight?: string;
}

// ─── Cost Breakdown Table ─────────────────────────────────────────────────────
// 3-column dollar table with row labels and a styled total row. Used by the
// EV report to walk through Annual fuel cost / Annual home electricity /
// Annual EV charging deltas.

export interface CostBreakdownRow {
  label: string;
  values: string[];          // one per column
  /**
   * Per-column color override. Common pattern: '+$N' lines in red,
   * '−$N' lines in green. When undefined a column uses Foreground/700.
   */
  valueColors?: (string | undefined)[];
}

export interface CostBreakdownSection {
  type: 'cost-breakdown';
  /** Column headers, e.g. ["GASOLINE CAR", "WITH EV", "CHANGE"]. */
  columns: string[];
  rows: CostBreakdownRow[];
  total: CostBreakdownRow; // styled with Webapp/Label/MM/Bold
}

// ─── Bill KPI Tiles ───────────────────────────────────────────────────────────
// Three colored tiles for the High Bill report. Each tile shows a label,
// a big number, an optional percentage delta chip, and a subtext line.
//
// Surface variants:
//  - 'blue'   — Web/Blue/300 (#B5E4FF), value rendered ExtraBold (anchor tile)
//  - 'orange' — raw #FCAC80 (Web/Yellow/300-ish), value rendered Bold (delta tile)
// The percent chip lives only on delta tiles; its label colour is Solar/700.

export interface BillKpiTile {
  label: string;
  value: string;
  delta?: string;
  subtext: string;
  /**
   * 'blue' (analyzed cycle) — dark #125AAA surface, white text, no shadow.
   * 'orange' (vs. previous bill cycle) — #FFDC9B surface, black text, shadow.
   * 'purple' (vs. same time previous year) — #B8B8FF surface, black text, shadow.
   */
  surface: 'blue' | 'orange' | 'purple';
}

export interface BillKpiTilesSection {
  type: 'bill-kpi-tiles';
  tiles: BillKpiTile[];
}

// ─── Trend Bar Chart ──────────────────────────────────────────────────────────
// 13-month bar chart with 3 highlighted bars (same-time-previous-year,
// previous-bill-cycle, analyzed-cycle) plus a bottom legend. Used in the
// High Bill report.

export interface TrendBarPoint {
  label: string;          // x-axis label, e.g. "Apr"
  value: number;          // numeric height
  tone?: 'purple' | 'orange' | 'blue'; // omit for a neutral grey bar
  displayValue?: string;  // dollar label shown above the bar, e.g. "$284" — only set on highlighted bars
  yearSuffix?: string;    // small label under the month, e.g. "2025"
  boldLabel?: boolean;    // bold x-axis label (the current/analyzed month)
}

export interface TrendBarChartSection {
  type: 'trend-bar-chart';
  label: string;           // e.g. "USAGE HISTORY — LAST 13 MONTHS"
  rightCaption?: string;   // e.g. "Labels indicate the bill cycle end month."
  legend?: { label: string; tone: 'purple' | 'orange' | 'blue' }[]; // bottom legend row
  points: TrendBarPoint[];
  insight?: string;        // optional tinted callout below the chart
}

// ─── Driver Breakdown ─────────────────────────────────────────────────────────
// Nested attribution card explaining a bill delta: a stack of driver groups,
// each with a header (title, optional "DOMINANT CAUSE" badge, description,
// amount) and a list of detail rows underneath. Rows come in 3 visual
// variants — see DriverRow.

export interface DriverRow {
  title: string;
  description: string;
  amount: string;
  /** Small up-arrow + category glyph, black amount. Used for a group's top-level rows. */
  categoryIcon?: 'heating' | 'always-on' | 'ev' | 'other';
  /** Big arrow + 40px left indent + grey amount. Used for a row's own sub-detail. */
  indent?: boolean;
  /** Big arrow, no indent, secondary (darker grey) text + amount. */
  secondary?: boolean;
  /** Underlined confirmation prompt under the description, e.g. "Confirm you have an EV". */
  flag?: string;
}

export interface DriverGroup {
  title: string;              // e.g. "Non-Weather Consumption"
  dominant?: boolean;         // white "DOMINANT CAUSE" pill + pink/red surface
  description: string;
  amount: string;             // header-level amount, e.g. "+$41"
  rows: DriverRow[];
}

export interface DriverBreakdownSection {
  type: 'driver-breakdown';
  label: string;              // header label, e.g. "Why $87 Up over previous bill cycle"
  description?: string;       // e.g. "The breakdown below focuses on..."
  groups: DriverGroup[];
}

// ─── Numbered Insights ────────────────────────────────────────────────────────
// Numbered list with a dark FG/500 rounded square badge on the left and a
// rich-text body on the right. Used by the High Bill "KEY INSIGHTS" section.

export interface NumberedInsight {
  body: Array<{ text: string; bold?: boolean; color?: string }>;
}

export interface NumberedInsightsSection {
  type: 'numbered-insights';
  label: string;
  insights: NumberedInsight[];
}

// ─── Optimizer Summary ────────────────────────────────────────────────────────
// Top-of-Optimizer-report block with three colored KPI tiles, a green
// peer-parity callout banner, and a grey peer-benchmark footnote.
// Renders as a single white-surface section (no padding from ReportWebView).

export interface OptimizerKpiTile {
  label: string;
  value: string;
  subtext: string;
  surface: 'blue' | 'violet' | 'mint';
}

export interface OptimizerSummarySection {
  type: 'optimizer-summary';
  tiles: OptimizerKpiTile[];
  insight: string;    // green-tinted banner — "your X already match peers"
  footnote: string;   // peer-benchmark fine print
}

// ─── Top Savings Tips ─────────────────────────────────────────────────────────
// 3-column numbered cards on a white-stroked card. Dividers between columns.

export interface TopSavingsTipCard {
  number: string;      // "01", "02", "03"
  title: string;       // "Shift Pool Pump — $143/yr"
  description: string; // small-grey one-liner
}

export interface TopSavingsTipsSection {
  type: 'top-savings-tips';
  label: string;       // "TOP SAVINGS TIPS"
  tips: TopSavingsTipCard[];
}

// ─── Rate-Plan Savings (compound) ─────────────────────────────────────────────
// "RATE PLAN RELATED SAVINGS" header + green-surface plan callout (with
// import bar) + TOU chart card + 3 single-column behavioral tweak rows.

export interface OptimizerImportPeriod {
  tier: '$' | '$$' | '$$$';
  widthFr: number;
  timeRange: string;
}

export interface TouChartTier {
  label: string;
  tone: 'off-peak' | 'mid-peak' | 'peak';
  kwh: number;     // numeric; absolute value (not normalized) — used for label
  dollar: number;  // numeric; for label
}

export interface BehavioralTweakRow {
  icon: 'cooling' | 'pool' | 'ev';
  title: string;
  description: string;
  fromLabel: string;     // "4–9pm" — red error chip
  toLabel: string;       // "Before 4pm" — green success chip
  savings: string;       // "saves $90/yr"
}

export interface RatePlanSavingsSection {
  type: 'rate-plan-savings';
  label: string;                   // "RATE PLAN RELATED SAVINGS"
  badge: string;                   // "YOU ARE ON BEST RATE PLAN"
  planName: string;                // "TOU Saver Plan A"
  planDescription: string;
  importLabel: string;             // "IMPORT (YOU BUY FROM GRID)"
  importPeriods: OptimizerImportPeriod[];
  touChartLabel: string;           // "ENERGY USAGE BY TIME OF USE"
  touTiers: TouChartTier[];
  tweaks: BehavioralTweakRow[];
}

// ─── Appliance Efficiency (compound) ──────────────────────────────────────────
// "APPLIANCE EFFICIENCY" header + donut card + 3 stacked category cards
// (HVAC, Water heating, Always-on baseload). Each category card shows a
// title + description, 3 KPI sub-tiles (you/peer/savings), and a list of
// sub-actions with savings amounts.

export interface ApplianceCategoryDonutSlice {
  label: string;
  value: string;       // "$920"
  numericValue: number; // for slice angle
  color: string;       // hex
}

export interface ApplianceCategoryAction {
  title: string;
  description: string;
  savings: string;     // "saves $105"
}

export interface ApplianceCategoryCard {
  title: string;          // "HVAC"
  description: string;
  todayCost: string;      // "$920 /year"
  peerCost: string;       // "$640 /year"
  savingsCost: string;    // "$280 /year"
  waysLabel: string;      // "FOUR WAYS TO GET THERE"
  actions: ApplianceCategoryAction[];
}

export interface ApplianceEfficiencySection {
  type: 'appliance-efficiency';
  label: string;          // "APPLIANCE EFFICIENCY"
  donutTotal: string;     // center label "$2,640"
  donutSlices: ApplianceCategoryDonutSlice[];
  categories: ApplianceCategoryCard[];
}

// ─── Capital Actions (Home Optimizer V2) ──────────────────────────────────────
// A bordered white card: header (icon + big title + description) followed by
// a vertical stack of upgrade items, each divided by a hairline. Every item
// has an icon, title/description, a row of 3 stat tiles (Investment/Payback/
// Savings — the last one green-highlighted), an optional italic footnote,
// and an optional full-width outlined CTA link.

export interface CapitalActionStat {
  label: string;           // "Investment" | "Payback" | "Potential savings"
  value: string;           // "~$150–300" | "2–3 yrs" | "$120/yr"
  tone?: 'default' | 'savings';
}

export interface CapitalActionCard {
  icon: 'thermometer' | 'pool-pump' | 'heating' | 'solar';
  title: string;
  description: string;
  stats: CapitalActionStat[];
  footnote?: string;       // e.g. "¹ Based on ENERGY STAR® estimates..."
  ctaLabel?: string;       // "Check Utility Rebates" / "Get Solar Report"
  ctaUrl?: string;
}

export interface CapitalActionsSection {
  type: 'capital-actions';
  icon: 'bar-chart';
  label: string;           // "Capital Investments • Save Up to $2,100/year"
  description: string;
  cards: CapitalActionCard[];
}

// ─── Narrative / Rich Text ────────────────────────────────────────────────────

export interface NarrativeSection {
  type: 'narrative';
  body: Array<{ text: string; bold?: boolean }>;
}

// ─── Bill Donut (Home Optimizer) ───────────────────────────────────────────────
// Standalone conic-gradient donut + legend list, e.g. "BILL BREAKDOWN IN LAST
// 12 MONTHS" — distinct from the appliance-efficiency section's embedded donut.

export interface BillDonutSlice {
  label: string;
  value: number; // for slice angle
  displayValue: string; // e.g. "$920"
  color: string; // hex
}

export interface BillDonutSection {
  type: 'bill-donut';
  title: string; // e.g. "BILL BREAKDOWN IN LAST 12 MONTHS"
  centerLabel: string; // e.g. "$2,640"
  slices: BillDonutSlice[];
}

// ─── What's Included (Home Optimizer) ──────────────────────────────────────────

export interface IncludedCard {
  icon: 'leaf' | 'price-tag' | 'bar-chart';
  title: string;
  description: string;
  savingsLabel: string; // "Potential savings" (or "Status" for a non-dollar state)
  savingsAmount: string; // "$672/year" (or "✓ Already optimized")
}

export interface WhatsIncludedSection {
  type: 'whats-included';
  title: string;
  description: string;
  cards: IncludedCard[];
}

// ─── Efficiency Deep-Dive (Home Optimizer) ─────────────────────────────────────
// A banner + a stack of appliance categories, each rendered as a free-form
// list of typed blocks (chart, callout, setpoint slider, saturation card,
// technician CTA, bar comparison, chip list, green action list). Categories
// differ enough in content (Cooling/Heating get a usage chart + setpoint
// slider + saturation card; Always-On/Pool-Pump get a typical-vs-your bar
// chart; Water Heating gets two action lists) that a flexible block list is
// simpler than one rigid per-category shape.

export interface EfficiencyHourlyChartBlock {
  kind: 'hourly-chart';
  color: string; // stroke hex
}

export interface EfficiencyCalloutBlock {
  kind: 'callout';
  title: string;
  description: string;
  amount: string; // "saves $90"
}

export interface EfficiencySetpointBlock {
  kind: 'setpoint';
  title: string;
  lowerLabel: string; // "Lower Set Point ($$$)"
  higherLabel: string; // "Higher Set Point ($)"
  thumbPct: number; // 0..1 position along the gradient bar
  callout: EfficiencyCalloutBlock;
}

export interface EfficiencySaturationBlock {
  kind: 'saturation';
  subtitle: string; // section subtitle above the card, e.g. "Your AC shows signs of..."
  title: string; // "Saturation Detected"
  description: string;
  chartImage: string; // asset path
  causes: string[];
}

export interface EfficiencyCtaTechnicianBlock {
  kind: 'cta-technician';
  title: string;
  description: string;
  linkLabel: string; // "Check Available Services"
  savingsLabel: string; // "saves upto $80"
}

export interface EfficiencyBarCompareRow {
  label: string; // "Typical usage" | "Your Usage"
  displayValue: string; // "$200/year" or "~8 hours/day"
  widthPct: number; // 0..1
  tone: 'green' | 'orange';
}

export interface EfficiencyBarCompareBlock {
  kind: 'bar-compare';
  rows: EfficiencyBarCompareRow[];
}

export interface EfficiencyChipsBlock {
  kind: 'chips';
  title?: string;
  items: string[];
}

export interface EfficiencyGreenListItem {
  title: string;
  description: string;
  hasArrow?: boolean;
}

export interface EfficiencyGreenListBlock {
  kind: 'green-list';
  title: string;
  description?: string;
  amount: string; // "saves $90/yr"
  items: EfficiencyGreenListItem[];
}

export interface EfficiencyConfirmFlagBlock {
  kind: 'confirm-flag';
  label: string;
}

export type EfficiencyBlock =
  | EfficiencyHourlyChartBlock
  | EfficiencyCalloutBlock
  | EfficiencySetpointBlock
  | EfficiencySaturationBlock
  | EfficiencyCtaTechnicianBlock
  | EfficiencyBarCompareBlock
  | EfficiencyChipsBlock
  | EfficiencyGreenListBlock
  | EfficiencyConfirmFlagBlock;

export interface EfficiencyCategory {
  icon: 'cooling' | 'heating' | 'always-on' | 'pool-pump' | 'water-heating';
  label: string; // "COOLING"
  subtitle: string;
  subtitleNote?: string; // Always-On's second descriptive line
  blocks: EfficiencyBlock[];
}

export interface EfficiencyDeepDiveSection {
  type: 'efficiency-deepdive';
  bannerTitle: string; // "Energy Efficiency · Save up to $672/year"
  bannerDescription: string;
  categories: EfficiencyCategory[];
}

// ─── Discriminated Union ─────────────────────────────────────────────────────

export type ReportSection =
  | KpiRowSection
  | BarComparisonSection
  | MonthlyChartSection
  | SystemRecommendationSection
  | SizeComparisonSection
  | HourlyProfileSection
  | RatePlanSection
  | InputsSection
  | NeighborhoodSection
  | FaqSection
  | CtaBannerSection
  | CostComparisonBarSection
  | CostBreakdownSection
  | TweaksGridSection
  | AlternativePlansTableSection
  | BillKpiTilesSection
  | TrendBarChartSection
  | DriverBreakdownSection
  | NumberedInsightsSection
  | OptimizerSummarySection
  | TopSavingsTipsSection
  | RatePlanSavingsSection
  | ApplianceEfficiencySection
  | CapitalActionsSection
  | BillDonutSection
  | WhatsIncludedSection
  | EfficiencyDeepDiveSection
  | NarrativeSection;

// ─── Top-level Report ────────────────────────────────────────────────────────

export interface Report {
  id: string;
  title: string;
  titleAccentWords: string[]; // words in the title to render in accent color
  /**
   * Hex color for accent words in the title.
   * Defaults to Web/Appliance/Solar/700 (#A9640B). Override per-report:
   *   solar  → '#A9640B'
   *   EV     → '#14843C' (Web/Green/600)
   *   bill   → '#1467D5' (Web/Info/500)
   */
  titleAccentColor?: string;
  /**
   * When true, the report outer surface is white instead of FBFBFC, and
   * the title block sits flush with the rest of the white-surface bands.
   * Used by the Optimizer report (Figma 1497:11276) where every band is
   * white and the FBFBFC pattern would create a visible seam at the top.
   */
  whiteSurface?: boolean;
  subtitle: string;
  generatedAt: string; // ISO 8601
  customer: CustomerInfo;
  branding: BrandingInfo;
  sections: ReportSection[];
  sources?: string[]; // attribution lines for footer
}
