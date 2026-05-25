// Persistence layer — read/write the platform's per-user state to
// localStorage. Schema-versioned so we can evolve the shape later without
// blowing up sessions that have older data.
//
// Stored fields:
//   - candidateName        — appears on the certificate
//   - vdomEnabled          — VDOM viewer toggle (Settings)
//   - perStep[stepId]      — attempts, hints used, pass status, in-progress code
//
// All API is sync (localStorage is sync); the wrapper just adds JSON parse,
// schema-version handling, and a quiet fallback when storage is disabled
// (private mode, quotas, etc.).

export interface StepState {
  /** Total Run-button presses on this step so far. */
  attempts: number;
  /** Consecutive failed runs since the last hint reveal. Drives auto-hint. */
  failuresSinceLastHint: number;
  /** Number of hints revealed (manual + auto). 0..step.hints.length. */
  hintsRevealed: number;
  /** True once the user has passed at least once. Never flips back to false. */
  passed: boolean;
  /** Wall-clock time of first pass (ms since epoch). Undefined if not passed. */
  passedAt?: number;
  /** Total attempts at the moment of first pass. Drives scoring. */
  attemptsToFirstPass?: number;
  /** Last user code (the editor buffer). Restored on reload. */
  code?: string;
}

export interface PlatformState {
  /** Bump on any breaking shape change so old data is discarded cleanly. */
  schemaVersion: 1;
  /** Display name on the certificate. Empty until the user fills it in. */
  candidateName: string;
  /** Whether the Settings-panel VDOM viewer is on. */
  vdomEnabled: boolean;
  /** Per-step records, keyed by Step.id. */
  perStep: Record<string, StepState>;
}

const STORAGE_KEY = 'unreact-platform:v1';

function emptyStepState(): StepState {
  return {
    attempts: 0,
    failuresSinceLastHint: 0,
    hintsRevealed: 0,
    passed: false,
  };
}

function emptyState(): PlatformState {
  return {
    schemaVersion: 1,
    candidateName: '',
    vdomEnabled: false,
    perStep: {},
  };
}

/** Quietly returns null if localStorage is unavailable (private mode etc.). */
function safeGetStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadState(): PlatformState {
  const storage = safeGetStorage();
  if (!storage) return emptyState();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PlatformState>;
    if (parsed.schemaVersion !== 1) return emptyState();
    return {
      schemaVersion: 1,
      candidateName: typeof parsed.candidateName === 'string' ? parsed.candidateName : '',
      vdomEnabled: !!parsed.vdomEnabled,
      perStep: parsed.perStep && typeof parsed.perStep === 'object' ? parsed.perStep : {},
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state: PlatformState): void {
  const storage = safeGetStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded, etc. — silently ignore; in-memory state is still good.
  }
}

export function getStepState(state: PlatformState, stepId: string): StepState {
  return state.perStep[stepId] ?? emptyStepState();
}

/** Returns a NEW PlatformState with stepId's record updated via `update`. */
export function updateStep(
  state: PlatformState,
  stepId: string,
  update: (prev: StepState) => StepState,
): PlatformState {
  const prev = getStepState(state, stepId);
  const next = update(prev);
  return {
    ...state,
    perStep: { ...state.perStep, [stepId]: next },
  };
}

/**
 * Wipe all platform state. Useful for "Start over" UX and for tests.
 * Returns the empty state so callers can set it as in-memory state too.
 */
export function resetState(): PlatformState {
  const storage = safeGetStorage();
  if (storage) {
    try { storage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  }
  return emptyState();
}
