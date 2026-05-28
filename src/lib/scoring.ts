// Score model — kept pure and isolated so it's easy to test and to tune
// without touching React state.
//
// Per step:
//   base 100
//   − 10 × hintsRevealed                       (using hints costs a little)
//   −  5 × max(0, attemptsToFirstPass − 1)     (extra runs cost a little)
//   floored at 0, capped at 100.
//
// Overall: arithmetic mean across passed steps, rounded to nearest int.
// Steps that have not been passed contribute 0 to the mean.

import type { PlatformState, StepState } from './storage';

const BASE = 100;
const HINT_PENALTY = 10;
const ATTEMPT_PENALTY = 5;

export function scoreForStep(state: StepState): number {
  if (!state.passed) return 0;
  const attempts = state.attemptsToFirstPass ?? state.attempts ?? 1;
  const extraAttempts = Math.max(0, attempts - 1);
  const raw = BASE - HINT_PENALTY * state.hintsRevealed - ATTEMPT_PENALTY * extraAttempts;
  return Math.max(0, Math.min(100, raw));
}

export interface ScoreBreakdown {
  /** Per-step scores in the same order as the input ids. */
  perStep: Array<{ id: string; score: number; passed: boolean }>;
  /** Sum of per-step scores. */
  total: number;
  /** total / (N × 100) as a percent (0..100). */
  percent: number;
  /** Count of passed steps. */
  passedCount: number;
  /** Count of steps considered. */
  totalSteps: number;
}

export function computeScore(state: PlatformState, stepIds: string[]): ScoreBreakdown {
  const perStep = stepIds.map((id) => {
    const s = state.perStep[id];
    const sc = s ? scoreForStep(s) : 0;
    return { id, score: sc, passed: !!s?.passed };
  });
  const total = perStep.reduce((n, s) => n + s.score, 0);
  const totalSteps = stepIds.length;
  const percent = totalSteps === 0
    ? 0
    : Math.round((total / (totalSteps * 100)) * 100);
  const passedCount = perStep.filter((s) => s.passed).length;
  return { perStep, total, percent, passedCount, totalSteps };
}

/** "0 / 8 complete", "8 / 8 complete", etc. */
export function passedSummary(state: PlatformState, stepIds: string[]): string {
  const passed = stepIds.filter((id) => state.perStep[id]?.passed).length;
  return `${passed} / ${stepIds.length} complete`;
}

export function isAllPassed(state: PlatformState, stepIds: string[]): boolean {
  if (stepIds.length === 0) return false;
  return stepIds.every((id) => state.perStep[id]?.passed);
}
