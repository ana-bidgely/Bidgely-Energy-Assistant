// Curated prompts for the "Understand my Bill" chip dropdown.
// Each row shows `display` in the UI; clicking sends `underlyingPrompt` to the chat.

import type { ChatMessage, DispatchResult, PanelKey } from './types';

export type BillToolKind = 'widget' | 'report';

export interface BillSuggestionTool {
  name: string;
  kind: BillToolKind;
}

export interface BillSuggestion {
  id: string;
  display: string;
  underlyingPrompt: string;
  /** Which tool opens when the user picks this row (report still wins when listed). */
  primaryToolName?: string;
  tools: BillSuggestionTool[];
}

export const BILL_SUGGESTIONS_VISIBLE_DEFAULT = 3;

export const BILL_SUGGESTIONS: BillSuggestion[] = [
  {
    id: 'high-bill',
    display: 'Explain my high bill this month',
    underlyingPrompt: 'Why is my bill higher this month?',
    tools: [
      { name: 'Bill Analysis', kind: 'widget' },
      { name: 'Home Optimizer Report', kind: 'report' },
    ],
  },
  {
    id: 'paying-for',
    display: "Show me what I'm paying for",
    underlyingPrompt: 'What am I actually paying for?',
    tools: [{ name: 'Monthly Summary', kind: 'widget' }],
  },
  {
    id: 'biggest-costs',
    display: 'See my biggest costs',
    underlyingPrompt: "What's costing me the most at home?",
    primaryToolName: 'Monthly Summary',
    tools: [
      { name: 'Bill Analysis', kind: 'widget' },
      { name: 'Monthly Summary', kind: 'widget' },
    ],
  },
  {
    id: 'compare-months',
    display: 'Compare this month to last',
    underlyingPrompt: 'How does this month compare to last month?',
    tools: [{ name: 'Bill Analysis', kind: 'widget' }],
  },
  {
    id: 'project-bill',
    display: 'Project my next bill',
    underlyingPrompt: "What's my bill going to look like next month?",
    tools: [{ name: 'Bill Projection', kind: 'widget' }],
  },
  {
    id: 'peak-hours',
    display: 'Show my peak usage hours',
    underlyingPrompt: 'When during the day do I use the most power?',
    tools: [{ name: 'Energy Details', kind: 'widget' }],
  },
  {
    id: 'ac-costs',
    display: 'See my AC costs',
    underlyingPrompt: 'How much is my AC costing me?',
    tools: [{ name: 'Energy Details', kind: 'widget' }],
  },
  {
    id: 'heating-costs',
    display: 'See my heating costs',
    underlyingPrompt: 'How much is my heating costing me?',
    tools: [{ name: 'Energy Details', kind: 'widget' }],
  },
  {
    id: 'similar-homes',
    display: 'Compare me to similar homes',
    underlyingPrompt: 'Am I using more than my neighbors?',
    tools: [{ name: 'SHC', kind: 'widget' }],
  },
  {
    id: 'usage-history',
    display: 'Show my usage history',
    underlyingPrompt: 'Show me my usage over the past year',
    tools: [{ name: 'Energy Details', kind: 'widget' }],
  },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
}

function id() {
  return Math.random().toString(36).slice(2);
}

function msg(text: string, extras: Partial<ChatMessage> = {}): ChatMessage {
  return { id: id(), role: 'assistant', text, timestamp: Date.now(), ...extras };
}

function resolveTool(suggestion: BillSuggestion): BillSuggestionTool {
  const report = suggestion.tools.find((t) => t.kind === 'report');
  if (report) return report;
  if (suggestion.primaryToolName) {
    const named = suggestion.tools.find((t) => t.name === suggestion.primaryToolName);
    if (named) return named;
  }
  return suggestion.tools[0];
}

function panelKeyForTool(toolName: string): PanelKey {
  switch (toolName) {
    case 'Monthly Summary':
      return 'monthly-summary';
    case 'Energy Details':
      return 'energy-details';
    default:
      return 'bill-tool';
  }
}

function openWidgetPlaceholder(toolName: string, intro: string, panelKey?: PanelKey): DispatchResult {
  const key = panelKey ?? panelKeyForTool(toolName);
  return {
    message: msg(intro, {
      reportCard: { label: `Open ${toolName}`, panel: key, panelTitle: toolName },
    }),
    openPanel: { key, title: toolName },
  };
}

function buildDispatch(suggestion: BillSuggestion): DispatchResult {
  const tool = resolveTool(suggestion);

  switch (suggestion.id) {
    case 'high-bill':
      return {
        message: msg(
          `Yes — this cycle did come in higher than usual. I've put together a full breakdown of where your energy is going and the specific ways to bring it down.`,
          {
            reportCard: {
              label: 'View Home Optimizer Report',
              panel: 'bill-report',
              panelTitle: 'Home Optimizer Report',
            },
          },
        ),
        openPanel: { key: 'bill-report', title: 'Home Optimizer Report' },
      };

    case 'project-bill':
      return {
        message: msg(
          `Based on your usage so far this month, here's how your bill is tracking by your billing date:`,
          {
            widget: { type: 'projected-bill', current: 47, projected: 165, progressPct: 22 },
          },
        ),
      };

    case 'usage-history':
      return openWidgetPlaceholder(
        'Energy Details',
        `Here's your electricity usage over the past year — month by month on the right.`,
        'energy-details',
      );

    case 'paying-for':
      return openWidgetPlaceholder(
        tool.name,
        `Here's a breakdown of what you're paying for on your latest bill — charges, tiers, and delivery fees.`,
      );

    case 'biggest-costs':
      return openWidgetPlaceholder(
        'Monthly Summary',
        `These are the biggest drivers of your bill at home right now — ranked by cost and share of usage.`,
      );

    case 'compare-months':
      return openWidgetPlaceholder(
        tool.name,
        `Here's how this month stacks up against last month — usage, weather, and rate changes included.`,
      );

    case 'peak-hours':
      return openWidgetPlaceholder(
        tool.name,
        `Your peak usage hours are when you're drawing the most power — that pattern matters for time-of-use rates.`,
      );

    case 'ac-costs':
      return openWidgetPlaceholder(
        tool.name,
        `Here's what air conditioning is adding to your bill this period — runtime, share of total, and trend.`,
      );

    case 'heating-costs':
      return openWidgetPlaceholder(
        tool.name,
        `Here's what heating is costing you this period — how it compares to cooling and your overall bill.`,
      );

    case 'similar-homes':
      return openWidgetPlaceholder(
        tool.name,
        `Here's how your usage compares to similar homes in your area — efficient peers vs. your household.`,
      );

    default:
      return openWidgetPlaceholder(tool.name, `Opening ${tool.name} for you now.`);
  }
}

/** Match a bill-chip underlying prompt and return a tailored dispatch, or null. */
export function tryDispatchBillSuggestion(input: string): DispatchResult | null {
  const t = normalize(input.trim());
  const match = BILL_SUGGESTIONS.find((s) => normalize(s.underlyingPrompt) === t);
  if (!match) return null;
  return buildDispatch(match);
}
