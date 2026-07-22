// Solar "What if?" refine flow — lets the user swap any of the auto-detected
// roof assumptions for their own exact numbers, then rebuilds the Solar
// Savings Report with those numbers. Started only after the initial
// (assumption-based) solar report has already been shown and the user opts
// in via the "Yes, use my exact numbers" button.
//
//   step 0: assistant asks "how much usable roof space?"     (buttons)
//   step 1: assistant asks "which way does it face?"         (buttons)
//   step 2: assistant asks "how much shading?"                (buttons)
//   step 3: assistant asks "install cost per watt?"           (buttons)
//   step 4: assistant shows confirmation + CTA → re-opens 'solar-dynamic'
//
// Every question has a "Keep estimate" option — the report only needs to
// reflect the fields the user actually chose to override; skipped fields
// fall back to the same defaults the original assumptions used. That's what
// "some can remain assumption if user wants" means in practice: buildSolarInputs
// below fills in a default for anything left unanswered.

import type { ChatMessage, FlowData, SolarInputs } from '../types';

function id() {
  return Math.random().toString(36).slice(2);
}

/** Step-keyed assistant messages for the solar refine flow. */
export function getSolarRefineStep(step: number, data: FlowData): ChatMessage {
  switch (step) {
    case 0:
      return {
        id: id(),
        role: 'assistant',
        text:
          `Let's dial this in with your exact numbers.\n\n` +
          `First — about how much usable roof space do you have for panels?`,
        options: [
          { label: '~400 sq ft', value: 'roof:small' },
          { label: '~700 sq ft', value: 'roof:medium', note: 'estimated' },
          { label: '~1,000 sq ft', value: 'roof:large' },
          { label: 'Keep the estimate', value: 'roof:skip' },
        ],
        timestamp: Date.now(),
      };

    case 1: {
      const roof = data.roof as 'small' | 'medium' | 'large' | undefined;
      const note = roof
        ? `Got it — ${roof === 'small' ? '~400' : roof === 'large' ? '~1,000' : '~700'} sq ft.`
        : `No problem — we'll keep the estimated roof size.`;
      return {
        id: id(),
        role: 'assistant',
        text: `${note}\n\nWhich way does your roof mainly face?`,
        options: [
          { label: 'South-facing', value: 'orientation:south', note: 'best yield' },
          { label: 'East-facing', value: 'orientation:east' },
          { label: 'West-facing', value: 'orientation:west' },
          { label: 'North-facing', value: 'orientation:north' },
          { label: 'Keep the estimate', value: 'orientation:skip' },
        ],
        timestamp: Date.now(),
      };
    }

    case 2: {
      const orientation = data.orientation as 'south' | 'east' | 'west' | 'north' | undefined;
      const note = orientation
        ? orientation === 'south'
          ? `South-facing is the best orientation for generation — nice.`
          : `${orientation[0].toUpperCase()}${orientation.slice(1)}-facing noted — that shifts generation a bit vs. south.`
        : `We'll keep assuming a south-facing roof.`;
      return {
        id: id(),
        role: 'assistant',
        text: `${note}\n\nHow much shading does your roof get during the day?`,
        options: [
          { label: 'None', value: 'shade:none' },
          { label: 'Partial (some trees/buildings)', value: 'shade:partial' },
          { label: 'Heavy', value: 'shade:heavy' },
          { label: 'Keep the estimate', value: 'shade:skip' },
        ],
        timestamp: Date.now(),
      };
    }

    case 3: {
      const shade = data.shade as 'none' | 'partial' | 'heavy' | undefined;
      const note = shade
        ? shade === 'none'
          ? `Good — minimal shading means more of that sunlight reaches your panels.`
          : `Noted — we'll factor that shading into your generation estimate.`
        : `We'll keep the estimated shading level.`;
      return {
        id: id(),
        role: 'assistant',
        text: `${note}\n\nLast one — do you have a quote, or a target install cost per watt?`,
        options: [
          { label: '$2.50/W', value: 'cost:2.5', note: 'great deal' },
          { label: '$2.80/W', value: 'cost:2.8' },
          { label: '$3.10/W', value: 'cost:3.1', note: 'typical' },
          { label: 'Keep the estimate', value: 'cost:skip' },
        ],
        timestamp: Date.now(),
      };
    }

    case 4: {
      // The SolarInputs object itself is built by advance.ts (buildSolarInputs)
      // and threaded into the store — this message just confirms completion.
      return {
        id: id(),
        role: 'assistant',
        text:
          `Thanks — I've rebuilt your Solar Savings Report using your exact numbers ` +
          `(where you gave them) instead of estimates. Open it to see the updated system size, cost, and savings.`,
        reportCard: {
          label: 'View Solar Savings Report',
          panel: 'solar-dynamic',
          panelTitle: 'Solar Savings Report',
        },
        options: [
          { label: 'Yes, show updated report', value: '__open_solar_panel__', isReport: true },
          { label: 'No thanks', value: '__reset__' },
        ],
        timestamp: Date.now(),
      };
    }

    default:
      return {
        id: id(),
        role: 'assistant',
        text: 'Something went off track. Type anything to start over.',
        timestamp: Date.now(),
      };
  }
}

/** Parse a "roof:small|medium|large|skip" button value. Returns undefined for "skip". */
export function parseRoof(answer: string): 'small' | 'medium' | 'large' | undefined {
  const m = /roof:(small|medium|large)/.exec(answer);
  return m ? (m[1] as 'small' | 'medium' | 'large') : undefined;
}

/** Parse an "orientation:..." button value. Returns undefined for "skip". */
export function parseOrientation(answer: string): 'south' | 'east' | 'west' | 'north' | undefined {
  const m = /orientation:(south|east|west|north)/.exec(answer);
  return m ? (m[1] as 'south' | 'east' | 'west' | 'north') : undefined;
}

/** Parse a "shade:none|partial|heavy|skip" button value. Returns undefined for "skip". */
export function parseShade(answer: string): 'none' | 'partial' | 'heavy' | undefined {
  const m = /shade:(none|partial|heavy)/.exec(answer);
  return m ? (m[1] as 'none' | 'partial' | 'heavy') : undefined;
}

/** Parse a "cost:N" button value into a per-watt dollar figure. Returns undefined for "skip". */
export function parseCost(answer: string): number | undefined {
  const m = /cost:([\d.]+)/.exec(answer);
  return m ? parseFloat(m[1]) : undefined;
}

/** Build the final SolarInputs object once all four answers are in — any
 *  field left as "skip" falls back to the same default the auto-generated
 *  assumptions used, and is flagged as not-provided so the report can keep
 *  showing it under "ASSUMPTIONS" instead of "YOUR INPUTS". */
export function buildSolarInputs(data: FlowData): SolarInputs {
  return {
    roof: (data.roof as 'small' | 'medium' | 'large') || 'medium',
    shade: (data.shade as 'none' | 'partial' | 'heavy') || 'none',
    orientation: (data.orientation as 'south' | 'east' | 'west' | 'north') || 'south',
    installCostPerW: (data.installCostPerW as number) || 3.1,
    provided: {
      roof: data.roof !== undefined,
      shade: data.shade !== undefined,
      orientation: data.orientation !== undefined,
      installCostPerW: data.installCostPerW !== undefined,
    },
  };
}
