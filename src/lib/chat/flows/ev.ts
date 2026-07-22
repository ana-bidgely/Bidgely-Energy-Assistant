// EV flow — multi-step Q&A leading to the EV Savings Analysis report.
//
//   step 0: assistant asks "how many miles per month?"        (buttons)
//   step 1: assistant asks "where would you charge?"          (buttons)
//   step 2: assistant asks "what's your fuel economy?"        (buttons)
//   step 3: assistant asks "willing to charge off-peak?"      (buttons)
//   step 4: assistant shows savings summary + CTA → opens 'ev' panel
//
// Every question is answered by clicking a button (no free-text parsing of
// typed numbers needed) — each option's `value` is a short token that the
// parse* helpers below read directly. The four answers are threaded into
// buildEvReport() via the store's `evInputs`, so every number in the EV
// report — fuel cost, EV charging cost, savings, the "YOUR INPUTS" chips —
// reacts to what the user picked.

import type { ChatMessage, FlowData, EvInputs } from '../types';

function id() {
  return Math.random().toString(36).slice(2);
}

/** Step-keyed assistant messages for the EV flow. */
export function getEvStep(step: number, data: FlowData): ChatMessage {
  switch (step) {
    case 0:
      return {
        id: id(),
        role: 'assistant',
        text:
          `Great question — I can give you a personalised estimate.\n\n` +
          `How many miles do you drive per month on average?`,
        options: [
          { label: '300 miles', value: 'miles:300' },
          { label: '500 miles', value: 'miles:500' },
          { label: '1000 miles', value: 'miles:1000', note: 'most common' },
          { label: '1500 miles', value: 'miles:1500' },
        ],
        timestamp: Date.now(),
      };

    case 1: {
      const miles = (data.miles as number) || 1000;
      const fuelNote =
        miles >= 1200
          ? 'At that level of driving, fuel costs add up significantly.'
          : miles >= 700
          ? 'At that level of driving, fuel costs tend to add up quickly.'
          : 'Even at that mileage, switching to EV can reduce your fuel costs.';

      return {
        id: id(),
        role: 'assistant',
        text:
          `Got it — about ${miles.toLocaleString()} miles/month. ${fuelNote}\n\n` +
          `Where will you primarily charge your EV?`,
        options: [
          { label: '🏠 100% at Home', value: 'charging:home' },
          { label: '🔌 100% Outside (Public)', value: 'charging:public' },
        ],
        timestamp: Date.now(),
      };
    }

    case 2: {
      const atHome = data.charging === 'home';
      const note = atHome
        ? `Home charging gives us the best opportunity to optimise your rates.`
        : `Public charging works — home charging is even cheaper if you add it later.`;

      return {
        id: id(),
        role: 'assistant',
        text: `${note}\n\nWhat's your current vehicle's fuel economy?`,
        options: [
          { label: '20 mpg', value: 'mpg:20' },
          { label: '25 mpg', value: 'mpg:25' },
          { label: '30 mpg', value: 'mpg:30' },
          { label: "I don't know", value: 'mpg:28' },
        ],
        timestamp: Date.now(),
      };
    }

    case 3: {
      const mpg = (data.mpg as number) || 28;
      return {
        id: id(),
        role: 'assistant',
        text:
          `Great! We'll use ${mpg} mpg to estimate your current fuel costs.\n\n` +
          `Are you willing to charge during off-peak hours (typically overnight, 12 AM – 6 AM) for the best rate?`,
        options: [
          { label: 'Yes, charge off-peak', value: 'offpeak:yes' },
          { label: 'No, I have preferred hours', value: 'offpeak:no' },
        ],
        timestamp: Date.now(),
      };
    }

    case 4: {
      // The chat side intentionally does NOT reveal the answer (today's
      // total, EV total, savings). Those live in the right-panel EV report,
      // computed from the exact answers just collected.
      const miles = (data.miles as number) || 1000;
      const atHome = data.charging === 'home';
      const offPeak = data.offPeak !== false;

      const note = atHome
        ? offPeak
          ? `Off-peak home charging gets you the best rate available — that's where most of the win comes from.`
          : `Home charging works, though skipping off-peak hours leaves some savings on the table.`
        : `Public charging costs more per kWh than home charging, so your savings will be smaller.`;

      return {
        id: id(),
        role: 'assistant',
        text:
          `${note}\n\n` +
          `Based on ~${miles.toLocaleString()} miles/month, I've put together a side-by-side breakdown of cost today vs with an EV. Open the report to see the full numbers.`,
        reportCard: {
          label: 'View EV Savings Analysis',
          panel: 'ev',
          panelTitle: 'EV Savings Analysis',
        },
        options: [
          { label: 'Yes, show full report', value: '__open_ev_panel__', isReport: true },
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

/** Parse a "miles:N" button value into a number. */
export function parseMiles(answer: string): number {
  const m = /miles:(\d+)/.exec(answer);
  if (m) return parseInt(m[1], 10);
  // Fallback for any free-text digits, in case this is ever reached directly.
  const digits = answer.replace(/\D/g, '');
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : 1000;
}

/** Parse a "charging:home|public" button value. */
export function parseCharging(answer: string): 'home' | 'public' {
  return /home/i.test(answer) ? 'home' : 'public';
}

/** Parse a "mpg:N" button value into a number. */
export function parseMpg(answer: string): number {
  const m = /mpg:(\d+)/.exec(answer);
  if (m) return parseInt(m[1], 10);
  const digits = answer.replace(/\D/g, '');
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : 28;
}

/** Parse an "offpeak:yes|no" button value into a boolean. */
export function parseOffPeak(answer: string): boolean {
  return !/no/i.test(answer);
}

/** Build the final EvInputs object once all four answers are in. */
export function buildEvInputs(data: FlowData): EvInputs {
  return {
    milesPerMonth: (data.miles as number) || 1000,
    charging: (data.charging as 'home' | 'public') || 'home',
    mpg: (data.mpg as number) || 28,
    offPeak: data.offPeak !== false,
  };
}

// Legacy export — kept so existing call sites that kick off the EV flow with
// `getEvMessage()` continue to work; it now returns the introductory step 0.
export function getEvMessage(): ChatMessage {
  return getEvStep(0, {});
}
