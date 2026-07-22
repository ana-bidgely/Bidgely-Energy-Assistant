// Single source of truth for advancing an active conversational flow by one
// step in response to a user message (typed text OR option click).
//
// Returning `null` signals "this input doesn't advance the current flow" —
// the caller should fall through to the regular dispatcher.

import type { ChatMessage, FlowName, FlowData, PanelKey, EvInputs, SolarInputs } from '../types';
import { getEvStep, parseMiles, parseCharging, parseMpg, parseOffPeak, buildEvInputs } from './ev';
import { getSolarRefineStep, parseRoof, parseOrientation, parseShade, parseCost, buildSolarInputs } from './solar';

export interface AdvanceResult {
  /** The assistant's next message in the flow. */
  message: ChatMessage;
  /** New step index to write into the store. */
  nextStep: number;
  /** Updated flow data (carries roof / shade / miles / charging across steps). */
  nextData: FlowData;
  /** True when the flow has reached its terminal step — caller should clear flow state. */
  done: boolean;
  /** When set, caller should also call openPanel(key, title) — the terminal step
   *  of each flow auto-opens the corresponding report. The reportCard chip in
   *  the message remains as a handle to re-open the panel later. */
  openPanel?: { key: PanelKey; title: string };
  /** Set on the EV flow's terminal step — caller should persist this via
   *  setEvInputs() before resetting the flow, so the EV report reads it. */
  evInputs?: EvInputs;
  /** Set on the solar refine flow's terminal step — caller should persist this
   *  via setSolarInputs() before resetting the flow, so the solar report reads it. */
  solarInputs?: SolarInputs;
}

export function advanceFlowStep(
  text: string,
  flow: FlowName,
  step: number,
  data: FlowData,
): AdvanceResult | null {
  if (!flow) return null;

  // ── Solar (refine) ──────────────────────────────────────────────────────
  if (flow === 'solar') {
    if (step === 0) {
      const roof = parseRoof(text);
      const nextData = { ...data, roof };
      return { message: getSolarRefineStep(1, nextData), nextStep: 1, nextData, done: false };
    }
    if (step === 1) {
      const orientation = parseOrientation(text);
      const nextData = { ...data, orientation };
      return { message: getSolarRefineStep(2, nextData), nextStep: 2, nextData, done: false };
    }
    if (step === 2) {
      const shade = parseShade(text);
      const nextData = { ...data, shade };
      return { message: getSolarRefineStep(3, nextData), nextStep: 3, nextData, done: false };
    }
    if (step === 3) {
      const installCostPerW = parseCost(text);
      const nextData = { ...data, installCostPerW };
      return {
        message: getSolarRefineStep(4, nextData),
        nextStep: 4,
        nextData,
        done: true,
        openPanel: { key: 'solar-dynamic', title: 'Solar Savings Report' },
        solarInputs: buildSolarInputs(nextData),
      };
    }
  }

  // ── EV ──────────────────────────────────────────────────────────────────
  if (flow === 'ev') {
    if (step === 0) {
      const miles = parseMiles(text);
      const nextData = { ...data, miles };
      return { message: getEvStep(1, nextData), nextStep: 1, nextData, done: false };
    }
    if (step === 1) {
      const charging = parseCharging(text);
      const nextData = { ...data, charging };
      return { message: getEvStep(2, nextData), nextStep: 2, nextData, done: false };
    }
    if (step === 2) {
      const mpg = parseMpg(text);
      const nextData = { ...data, mpg };
      return { message: getEvStep(3, nextData), nextStep: 3, nextData, done: false };
    }
    if (step === 3) {
      const offPeak = parseOffPeak(text);
      const nextData = { ...data, offPeak };
      return {
        message: getEvStep(4, nextData),
        nextStep: 4,
        nextData,
        done: true,
        openPanel: { key: 'ev', title: 'EV Savings Analysis' },
        evInputs: buildEvInputs(nextData),
      };
    }
  }

  return null;
}
