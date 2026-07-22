// Free-text + option-click dispatcher for the chat assistant.
//
// Matching strategy: text is normalized (lowercased, trimmed, whitespace
// collapsed, surrounding punctuation stripped, smart-quotes flattened) before
// any pattern check, and each intent has multiple regex variants so phrasings
// like "is the EV worth it" / "is an EV good for me" / "ev worth getting" all
// land on the same intent.

import type { ChatMessage, DispatchResult, MessageOption, PanelKey } from './types';
import { USER } from '@/lib/data/user';
import { tryDispatchBillSuggestion } from './billSuggestions';
import { computeSolarMetrics } from '@/lib/data/computations';

// Estimated monthly cost on each rate plan (mirrors the original HTML).
// Our typed RatePlan struct only carries avgRate; for the conversational
// flow we want concrete dollar figures, so we colocate them here.
const RATE_PLAN_MONTHLY: Record<string, number> = {
  e1: Math.round(USER.bill.totalCost),
  'e-tou-c': 121,
};

function id() {
  return Math.random().toString(36).slice(2);
}

function msg(text: string, extras: Partial<ChatMessage> = {}): ChatMessage {
  return { id: id(), role: 'assistant', text, timestamp: Date.now(), ...extras };
}

const DEFAULT_OPTIONS: MessageOption[] = [
  { label: '☀️ Is solar worth it for me?', value: 'Is solar worth it for me?' },
  { label: '🚗 Is an EV a good fit?', value: 'Is an EV a good fit for me?' },
  { label: '💡 Why is my bill higher?', value: 'Why is my bill higher this month?' },
  { label: '📋 Am I on the best rate plan?', value: 'Am I on the best rate plan?' },
];

// ── Normalization ───────────────────────────────────────────────────────────
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
}

function matchAny(t: string, ...patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(t));
}

// ── Public entry point ─────────────────────────────────────────────────────
export type { DispatchResult } from './types';

export function dispatchInput(input: string): DispatchResult {
  const raw = input.trim();
  const t = normalize(raw);

  const billSuggestion = tryDispatchBillSuggestion(raw);
  if (billSuggestion) return billSuggestion;

  // ── Internal sentinels (option-click panel openers) ──────────────────────
  if (raw === '__reset__') {
    return { message: msg(`No problem — what else can I help you with?`, { options: DEFAULT_OPTIONS }) };
  }
  // Kicks off the solar "What if?" refine flow — offered right after the
  // auto-detected Solar Savings Report is shown (see intent 5 below).
  if (raw === '__start_solar_refine__') {
    return { message: msg(''), startFlow: 'solar' };
  }
  // Each panel-open response carries BOTH a reportCard chip (so the user can
  // re-open the panel later from the chat thread) AND the openPanel directive
  // (so the panel auto-opens immediately on intent).
  if (raw === '__open_solar_panel__') {
    return {
      message: msg(`Here's your solar savings analysis.`, {
        reportCard: { label: 'View Solar Savings Report', panel: 'solar-dynamic', panelTitle: 'Solar Savings Report' },
      }),
      openPanel: { key: 'solar-dynamic', title: 'Solar Savings Report' },
    };
  }
  if (raw === '__open_ev_panel__') {
    return {
      message: msg(`Here's your personalised EV savings analysis — based on your fuel spend and charging setup.`, {
        reportCard: { label: 'View EV Savings Analysis', panel: 'ev', panelTitle: 'EV Savings Analysis' },
      }),
      openPanel: { key: 'ev', title: 'EV Savings Analysis' },
    };
  }
  if (raw === '__open_bill_report__') {
    return {
      message: msg(`Here's your Home Optimizer Report — showing where your energy is going and every way to bring your bill down.`, {
        reportCard: { label: 'View Home Optimizer Report', panel: 'bill-report', panelTitle: 'Home Optimizer Report' },
      }),
      openPanel: { key: 'bill-report', title: 'Home Optimizer Report' },
    };
  }
  if (raw === '__open_rate_report__') {
    return {
      message: msg(`Here's your Rate Plan Analysis.`, {
        reportCard: { label: 'View Rate Plan Analysis', panel: 'rate-report', panelTitle: 'Rate Plan Analysis' },
      }),
      openPanel: { key: 'rate-report', title: 'Rate Plan Analysis' },
    };
  }

  // ── "What's my bill going to look like next month?" — bill-projection widget ─
  // (Lives ahead of the higher/lower bill intents because it's more specific.)
  if (matchAny(
    t,
    /\b(next|coming|upcoming) month\b.*\bbill\b/,
    /\bbill\b.*\b(next|coming|upcoming) month\b/,
    /\b(forecast|predict|projection|projected|estimate)\b.*\bbill\b/,
    /\bbill\b.*\b(forecast|prediction|projection|projected|estimate)\b/,
    /\bwhat.{0,12}(will|would|gonna|going to)\b.*\bbill\b/,
    /\bhow much.{0,12}\bbill\b/,
  )) {
    return {
      message: msg(
        // Architecture: the projection number lives in the widget below, not
        // in the chat text. The text only orients.
        `Based on your usage so far this month, here's how your bill is tracking by your billing date:`,
        {
          widget: { type: 'projected-bill', current: 47, projected: 165, progressPct: 22 },
        },
      ),
    };
  }

  // ── 1. "Analyse my latest bill" / "Is my bill high?" / "Why is my bill
  // higher?" — auto-analyze, no follow-up question. All three phrasings
  // route to the same High Bill Analyzer report.
  if (matchAny(
    t,
    /^is\b.*\bbill\b.*\bhigh\b/,
    /\b(why|reason).*\bbill\b.*\b(high|higher|up|spike|increas|more|expensive)\b/,
    /\bbill\b.*\b(higher|went up|going up|increased|more expensive)\b/,
    /\b(high|higher|expensive|spiked)\b.*\bbill\b/,
    /\bbill\b.*\bhigher\b/,
    /\banaly[sz]e?\b.*\bbill\b/,
    /\bbill\b.*\banaly[sz]e?\b/,
  )) {
    const currentPlan = USER.ratePlans.find((p) => p.current);
    const addressParts = USER.address.split(',').map((s) => s.trim());
    const cityState = addressParts.slice(-2).join(', ').toUpperCase();

    return {
      message: msg(`Let's check what's driving your bill this cycle.`, {
        widget: {
          type: 'analysis-profile',
          sections: [
            {
              heading: 'Analyzed your home energy profile',
              rows: [
                { icon: '🖥️', label: 'Utility', value: USER.utility },
                { icon: '📍', label: 'Location', value: cityState },
                { icon: '⚡', label: 'Rate Plan', value: currentPlan?.name ?? '—' },
                { icon: '📊', label: 'Annual Usage', value: `${(USER.bill.kwh * 12).toLocaleString()} kWh` },
                { icon: '🚗', label: 'EV', value: `Detected — ${USER.ev.make} ${USER.ev.model}` },
                { icon: '🏊', label: 'Pool Pump', value: 'Not Detected' },
              ],
            },
          ],
        },
      }),
      followUp: msg(`Your report is ready.`, {
        reportCard: { label: 'View High Bill Analyzer', panel: 'high-bill-analyzer', panelTitle: 'High Bill Analyzer' },
      }),
      openPanel: { key: 'high-bill-analyzer', title: 'High Bill Analyzer' },
    };
  }

  // ── 2. "Lower my energy costs" / generic savings intent — auto-analyze,
  // no follow-up question. Routes to the Home Optimizer Report (formerly
  // "Analyse my latest bill"'s target, moved here since that chip now goes
  // straight to the High Bill Analyzer above).
  if (matchAny(
    t,
    /\b(lower|reduc|cut|decreas)\b.*\b(bill|cost|costs|energy|spend|spending)\b/,
    /\b(how can i|how do i|ways to)\b.*\b(save|sav|lower|reduc|cut)\b/,
    /\bsave money\b/,
    /\b(tip|tips|optimi|efficient|cheaper)\b/,
  )) {
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
  }

  // ── 3. Rate plan intent — auto-analyze, no follow-up question ───────────
  // Same pattern as the solar intent: the assistant already has everything it
  // needs (bill, current plan, usage), so it responds immediately with the
  // profile snapshot and opens the report — no "want me to show it?" gate.
  if (matchAny(
    t,
    /\b(am i on|on the).*\b(best|right|cheapest)\b.*\b(rate|plan)\b/,
    /\b(best|right|cheapest|better)\b.*\b(rate|plan)\b/,
    /\b(find|get|switch|want|need)\b.*\b(rate|plan)\b/,
    /\b(rate plan|e-?tou|e-?1|tariff)\b/,
    /\bcompare\b.*\b(rate|plan)\b/,
  )) {
    const currentPlan = USER.ratePlans.find((p) => p.current);
    const addressParts = USER.address.split(',').map((s) => s.trim());
    const cityState = addressParts.slice(-2).join(', ').toUpperCase();

    return {
      message: msg(`Let's see which rate plan fits your energy usage best.`, {
        widget: {
          type: 'analysis-profile',
          sections: [
            {
              heading: 'Analyzed your home energy profile',
              rows: [
                { icon: '🖥️', label: 'Utility', value: USER.utility },
                { icon: '📍', label: 'Location', value: cityState },
                { icon: '⚡', label: 'Rate Plan', value: currentPlan?.name ?? '—' },
                { icon: '📊', label: 'Annual Usage', value: `${(USER.bill.kwh * 12).toLocaleString()} kWh` },
                { icon: '🚗', label: 'EV', value: `Detected — ${USER.ev.make} ${USER.ev.model}` },
                { icon: '🏊', label: 'Pool Pump', value: 'Not Detected' },
              ],
            },
          ],
        },
      }),
      followUp: msg(
        `A better rate plan may be available for your home.\n` +
          `We've analyzed your energy usage and evaluated available options.\n` +
          `Your personalized Rate Plan Analysis is ready.`,
        {
          reportCard: { label: 'View Rate Plan Analysis', panel: 'rate-report', panelTitle: 'Rate Plan Analysis' },
        },
      ),
      openPanel: { key: 'rate-report', title: 'Rate Plan Analysis' },
    };
  }

  // ── 4. EV intent — start the EV flow ────────────────────────────────────
  if (matchAny(
    t,
    /\b(is an?|should i get|worth getting an?|good fit for|considering)\b.*\bev\b/,
    /\bev\b.*\b(worth|good fit|good for me|right for me|a good idea)\b/,
    /\belectric vehicle\b/,
    /\bev\b.*\b(charg|cost|saving|breakdown)\b/,
    /^ev$/,
  )) {
    return { message: msg(''), startFlow: 'ev' };
  }

  // ── 5. Solar intent — auto-analyze, no follow-up questions ───────────────
  // The assistant already has everything it needs (bill, rate plan, roof via
  // Google Solar data), so it responds immediately with what it found and
  // opens the report — no roof-size / shading Q&A.
  if (matchAny(
    t,
    /\b(is solar|solar worth|worth (it|getting))\b/,
    /\b(should i get|thinking of|considering)\b.*\bsolar\b/,
    /\b(solar|photovoltaic|pv panels?|rooftop)\b/,
    /^panels?$/,
  )) {
    const m = computeSolarMetrics('medium', 'none', USER);
    const panelCount = Math.round(m.systemKw / 0.4);
    const roofSqFt = panelCount * 20;
    const currentPlan = USER.ratePlans.find((p) => p.current);
    const addressParts = USER.address.split(',').map((s) => s.trim());
    const cityState = addressParts.slice(-2).join(', ').toUpperCase();

    return {
      message: msg(
        `Let's see how solar could affect your energy costs.\n\n` +
          `Solar appears to be a strong fit for your home.\n` +
          `We've analyzed your energy usage and roof characteristics. Your personalized Solar Savings Report is ready.`,
        {
          widget: {
            type: 'analysis-profile',
            sections: [
              {
                heading: 'Analyzed your home energy profile',
                rows: [
                  { icon: '🖥️', label: 'Utility', value: USER.utility },
                  { icon: '📍', label: 'Location', value: cityState },
                  { icon: '⚡', label: 'Rate Plan', value: currentPlan?.name ?? '—' },
                  { icon: '📊', label: 'Annual Usage', value: `${(USER.bill.kwh * 12).toLocaleString()} kWh` },
                  { icon: '🚗', label: 'EV', value: `Detected — ${USER.ev.make} ${USER.ev.model}` },
                  { icon: '🏊', label: 'Pool Pump', value: 'Not Detected' },
                ],
              },
              {
                heading: 'Analyzed your roof using Google Solar data',
                rows: [
                  { icon: '☀️', label: 'Max capacity', value: '25 kW' },
                  { icon: '📐', label: 'Roof area', value: `~${roofSqFt.toLocaleString()} sq ft usable` },
                  { icon: '🌤️', label: 'Shade', value: 'None' },
                ],
              },
            ],
          },
          reportCard: { label: 'View Solar Savings Report', panel: 'solar-dynamic', panelTitle: 'Solar Savings Report' },
        },
      ),
      followUp: msg(`Want to swap any of those estimates for your exact roof details?`, {
        options: [
          { label: 'Yes, use my exact numbers', value: '__start_solar_refine__' },
          { label: 'No, these estimates work', value: '__reset__' },
        ],
      }),
      openPanel: { key: 'solar-dynamic', title: 'Solar Savings Report' },
    };
  }

  // ── 6. "Show me my bill" / "What changed in my usage?" — bill snapshot ──
  if (matchAny(
    t,
    /\bwhat\b.*\b(changed|different)\b.*\b(usage|bill|month)\b/,
    /\bshow\b.*\bbill\b/,
    /\b(my bill|the bill|view bill)\b/,
    /\b(charge|invoice|statement|tier|baseline)\b/,
    /\bbill\b/,
  )) {
    return {
      message: msg(
        // Architecture: dollar amounts (total, electric, gas) and tier
        // breakdowns live in the bill report on the right. The chat only
        // orients on the rate plan and the tier dynamic.
        `I've pulled up your most recent Energy Co bill on the right.\n\n` +
          `You're on the **E-1 Tiered Rate** plan — once you cross the baseline allowance each additional kWh costs significantly more, which is why higher-usage months hit your bill harder.\n\n` +
          `Let me know if you'd like me to explain any specific line item.`,
        {
          reportCard: { label: 'View Bill Breakdown', panel: 'bill', panelTitle: 'Bill Breakdown — March 2026' },
        },
      ),
      openPanel: { key: 'bill', title: 'Bill Breakdown — March 2026' },
    };
  }

  // ── 7. Greeting ─────────────────────────────────────────────────────────
  if (/^(hi|hello|hey|sup|yo|good\s*(morning|afternoon|evening))\b/.test(t)) {
    return {
      message: msg(`Hey ${USER.name}! What can I help you with today?`, { options: DEFAULT_OPTIONS }),
    };
  }

  // ── Custom fallback ─────────────────────────────────────────────────────
  return {
    message: msg(
      `Hmm, I didn't quite catch that one — let me know what you're curious about and I'll dig in. Or pick one of these to get started:`,
      { options: DEFAULT_OPTIONS },
    ),
  };
}

export function getWelcomeMessage(): ChatMessage {
  return msg(
    `Hi ${USER.name}! 👋 I'm your Energy Assistant. I can help you understand your bill, explore solar savings, optimize EV charging, or compare rate plans. What would you like to explore?`,
    { options: DEFAULT_OPTIONS },
  );
}
