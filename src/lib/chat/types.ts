export type PanelKey =
  | 'solar-dynamic'
  | 'ev'
  | 'bill-report'
  | 'rate-report'
  | 'bill'
  | 'bill-tool'
  | 'monthly-summary'
  | 'energy-details'
  | 'usage'
  | 'rate'
  | 'high-bill-analyzer';

export interface MessageOption {
  label: string;
  value: string;
  note?: string;
  isReport?: boolean;
}

export interface ReportCard {
  label: string;
  panel: PanelKey;
  panelTitle: string;
}

export interface AnalysisProfileRow {
  icon: string;
  label: string;
  value: string;
}

export interface AnalysisProfileSection {
  heading: string;
  rows: AnalysisProfileRow[];
}

/** Inline widgets rendered directly inside an assistant chat bubble.
 *  Discriminated by `type`; each variant carries its own data shape. */
export type ChatWidget =
  | {
      type: 'projected-bill';
      current?: number;
      projected?: number;
      progressPct?: number;
    }
  | {
      type: 'analysis-profile';
      sections: AnalysisProfileSection[];
    };

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  options?: MessageOption[];
  reportCard?: ReportCard;
  /** Inline widget rendered inside the assistant bubble (mini chart, KPI, etc.). */
  widget?: ChatWidget;
  /** Panel to open immediately when this message renders */
  openPanel?: { key: PanelKey; title: string };
  timestamp: number;
}

export interface DispatchResult {
  message: ChatMessage;
  /** A second assistant bubble appended right after `message` — e.g. the
   *  solar report's "want to swap estimates for exact numbers?" prompt,
   *  kept as its own bubble (and thus its own `options`) instead of being
   *  tacked onto the end of the analysis message. */
  followUp?: ChatMessage;
  /** Start a named flow at step 0. */
  startFlow?: 'solar' | 'ev';
  /** Open a side panel immediately when the message renders. */
  openPanel?: { key: PanelKey; title: string };
}

export type FlowName = 'solar' | 'ev' | null;

export interface FlowData {
  // Solar
  roof?: 'small' | 'medium' | 'large';
  shade?: 'none' | 'partial' | 'heavy';
  orientation?: 'south' | 'east' | 'west' | 'north';
  installCostPerW?: number;
  // EV
  miles?: number;
  charging?: 'home' | 'public';
  mpg?: number;
  offPeak?: boolean;
  [key: string]: unknown;
}

/** The EV flow's collected answers, in the shape the EV report builder
 *  consumes. Persisted separately from FlowData (which advanceFlow/resetFlow
 *  churn through) so the report keeps reflecting the last completed run. */
export interface EvInputs {
  milesPerMonth: number;
  charging: 'home' | 'public';
  mpg: number;
  offPeak: boolean;
}

/** The "What if?" solar refine flow's collected answers. Any field the user
 *  chose to "keep as estimate" is filled with the same default the auto
 *  analysis originally used, so the report always has a concrete value to
 *  compute with — but `provided` tracks which fields were actually answered
 *  vs kept as an estimate, so the report can show answered fields under
 *  "YOUR INPUTS" and kept-as-estimate fields under "ASSUMPTIONS". Persisted
 *  outside FlowData (same reasoning as EvInputs) so the solar report keeps
 *  reflecting the last completed refine run after the flow resets. */
export interface SolarInputs {
  roof: 'small' | 'medium' | 'large';
  shade: 'none' | 'partial' | 'heavy';
  orientation: 'south' | 'east' | 'west' | 'north';
  installCostPerW: number;
  provided: {
    roof: boolean;
    shade: boolean;
    orientation: boolean;
    installCostPerW: boolean;
  };
}
