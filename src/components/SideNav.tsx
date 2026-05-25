import type { Step } from '../types';

// The curriculum. As new steps are added to src/steps/, give each one an
// entry here so it appears in its stage with the right title. Steps whose
// `id` doesn't (yet) exist in the steps array render as "planned" — visible
// but muted, conveying the journey without faking completion.
interface PlannedStep {
  id: string;
  label: string;
}
interface Stage {
  id: string;
  label: string;
  steps: PlannedStep[];
}

const CURRICULUM: Stage[] = [
  {
    id: 'foundations',
    label: 'Foundations',
    steps: [
      { id: '01-create-element', label: 'createElement' },
    ],
  },
  {
    id: 'rendering',
    label: 'Rendering',
    steps: [
      { id: '02-render',         label: 'render' },
      { id: '03-create-dom',     label: 'createDom + updateDom' },
    ],
  },
  {
    id: 'concurrent',
    label: 'Concurrent rendering',
    steps: [
      { id: '04-work-loop',      label: 'workLoop' },
    ],
  },
  {
    id: 'reconciliation',
    label: 'Reconciliation',
    steps: [
      { id: '05-reconcile',      label: 'reconcileChildren' },
      { id: '06-commit',         label: 'commitRoot + commitWork' },
    ],
  },
  {
    id: 'hooks',
    label: 'Hooks',
    steps: [
      { id: '07-use-state',      label: 'useState' },
      { id: '08-function-comp',  label: 'function components' },
    ],
  },
];

interface Props {
  steps: Step[];
  currentStepId: string;
  /** Step ids the learner has already passed at least once. */
  passedStepIds: Set<string>;
  /** True once every implemented step has been passed at least once. */
  allPassed: boolean;
  /** Which top-level view is active — curriculum or completion. */
  activeView: 'curriculum' | 'completion';
  onSelectStep: (stepId: string) => void;
  onSelectCompletion: () => void;
  onSelectCurriculum: () => void;
}

/**
 * - `passed`    — implemented AND in passedStepIds
 * - `current`   — the step the curriculum view is showing right now
 * - `available` — implemented, not passed, and the previous step in the
 *                 curriculum has been passed (or this is the first step)
 * - `locked`    — implemented, but a prerequisite earlier step has not
 *                 yet been passed
 * - `planned`   — not implemented in src/steps/ yet
 */
type StepState = 'passed' | 'current' | 'available' | 'locked' | 'planned';

const FLAT_CURRICULUM: PlannedStep[] = CURRICULUM.flatMap((s) => s.steps);
const TOTAL_STEPS = FLAT_CURRICULUM.length;

function stateFor(
  stepId: string,
  implemented: Set<string>,
  passedStepIds: Set<string>,
  currentStepId: string,
): StepState {
  if (!implemented.has(stepId)) return 'planned';
  if (stepId === currentStepId) return 'current';
  if (passedStepIds.has(stepId)) return 'passed';
  // Gate on the immediately-previous curriculum entry. If that previous
  // entry isn't implemented yet we don't gate (no way to satisfy a
  // prerequisite that doesn't exist) — we still let the learner try this
  // one. If it IS implemented but not yet passed, this step is locked.
  const i = FLAT_CURRICULUM.findIndex((s) => s.id === stepId);
  const prev = i > 0 ? FLAT_CURRICULUM[i - 1] : undefined;
  if (!prev || !implemented.has(prev.id) || passedStepIds.has(prev.id)) {
    return 'available';
  }
  return 'locked';
}

export function SideNav({
  steps,
  currentStepId,
  passedStepIds,
  allPassed,
  activeView,
  onSelectStep,
  onSelectCompletion,
  onSelectCurriculum,
}: Props) {
  const implemented = new Set(steps.map((s) => s.id));
  const passedCount = FLAT_CURRICULUM.reduce(
    (n, s) => n + (passedStepIds.has(s.id) ? 1 : 0),
    0,
  );
  const availableCount = implemented.size;

  return (
    <aside className="flex flex-col h-full p-unit bg-surface-container-low border-r border-outline-variant w-[280px] shrink-0 hidden lg:flex">
      <button
        type="button"
        onClick={onSelectCurriculum}
        className="px-4 py-4 flex items-center gap-3 text-left cursor-pointer hover:bg-surface-container-highest"
      >
        <img
          src="/logo-icon.png"
          alt="un-React"
          className="w-10 h-10 shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <div className="font-headline-md text-headline-md text-on-surface font-bold leading-tight">
            un-React
          </div>
          <div className="font-label-sm text-label-sm text-on-surface-variant opacity-70">
            v0.4.2-beta
          </div>
        </div>
      </button>

      <div className="px-4 py-3 border-y border-outline-variant">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Progress
          </span>
          <span className="font-label-sm text-label-sm text-on-surface">
            {passedCount} / {TOTAL_STEPS}
          </span>
        </div>
        {/*
          Two-layer bar:
            · Background — full track (gray).
            · Middle layer — outline showing how many steps are even
              implemented yet (so the learner sees the "available zone").
            · Foreground amber — the actual completion (passedCount).
          Makes "you've passed 0 of 8, 2 are available, 6 are planned"
          legible at a glance without a wall of numbers.
        */}
        <div
          className="relative h-1 rounded-full bg-surface-container-high overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={passedCount}
          aria-label={`${passedCount} of ${TOTAL_STEPS} steps passed; ${availableCount} available`}
        >
          <div
            className="absolute inset-y-0 left-0 bg-surface-bright/60 transition-all duration-500 ease-out"
            style={{ width: `${(availableCount / TOTAL_STEPS) * 100}%` }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-0 left-0 bg-tertiary transition-all duration-500 ease-out"
            style={{ width: `${(passedCount / TOTAL_STEPS) * 100}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-1.5 font-label-sm text-label-sm text-on-surface-variant opacity-60">
          {availableCount} available · {TOTAL_STEPS - availableCount} planned
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {CURRICULUM.map((stage) => (
          <section key={stage.id} className="mb-4">
            <h3 className="px-4 mt-3 mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant opacity-70">
              {stage.label}
            </h3>
            <ul className="flex flex-col">
              {stage.steps.map((s) => {
                let state = stateFor(s.id, implemented, passedStepIds, currentStepId);
                // When the completion view is the active view, don't highlight
                // any step as "current" — the user is no longer in any step.
                if (activeView === 'completion' && state === 'current') {
                  state = passedStepIds.has(s.id) ? 'passed' : 'available';
                }
                // Clickable iff the step is "open" — passed steps can be
                // revisited; current + available + locked NO (current is
                // already shown; locked is locked; planned doesn't exist).
                const onSelect =
                  state === 'available' || state === 'passed'
                    ? () => onSelectStep(s.id)
                    : undefined;
                return (
                  <StepRow
                    key={s.id}
                    label={s.label}
                    state={state}
                    onSelect={onSelect}
                  />
                );
              })}
            </ul>
          </section>
        ))}

        {/*
          The finish line is always visible, even when locked, so the user
          can see what they're working toward. Once allPassed flips true
          the row animates in to its enabled style (slide + color shift).
        */}
        <section className="mt-4">
          <h3 className="px-4 mt-3 mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant opacity-70">
            Completion
          </h3>
          <ul className="flex flex-col">
            <li>
              <button
                type="button"
                onClick={allPassed ? onSelectCompletion : undefined}
                disabled={!allPassed}
                aria-disabled={!allPassed}
                aria-current={activeView === 'completion' ? 'page' : undefined}
                title={
                  allPassed
                    ? 'Open completion page'
                    : `Finish all ${steps.length === 1 ? 'the' : steps.length + ' implemented'} steps to unlock`
                }
                className={`w-full mx-2 px-3 py-2 flex items-center gap-3 rounded-lg text-left transition-all ${
                  !allPassed
                    ? 'text-on-surface-variant opacity-50 cursor-not-allowed'
                    : activeView === 'completion'
                      ? 'bg-primary-container text-on-primary-container cursor-pointer'
                      : 'text-on-surface hover:bg-surface-container-highest cursor-pointer animate-slide-in-x'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-sm ${
                    allPassed ? 'text-tertiary' : 'text-on-surface-variant'
                  }`}
                  style={allPassed ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {allPassed ? 'workspace_premium' : 'lock'}
                </span>
                <span className="font-body-md text-body-md truncate">
                  {allPassed ? 'Certificate' : 'Certificate (locked)'}
                </span>
              </button>
            </li>
          </ul>
        </section>
      </nav>

      <div className="p-4 flex items-center gap-3 border-t border-outline-variant">
        <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
          <span className="material-symbols-outlined">person</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-on-surface font-bold truncate">Developer</span>
          <span className="text-on-surface-variant text-xs opacity-60">Level 1: Novice</span>
        </div>
      </div>
    </aside>
  );
}

function StepRow({
  label,
  state,
  onSelect,
}: {
  label: string;
  state: StepState;
  /** Provided only when the row is actionable (available or passed). */
  onSelect?: () => void;
}) {
  const rowClass =
    state === 'current'   ? 'bg-primary-container text-on-primary-container rounded-lg transition-colors'
  : state === 'passed'    ? 'text-on-surface hover:bg-surface-container-highest rounded-lg cursor-pointer transition-colors'
  : state === 'available' ? 'text-on-surface hover:bg-surface-container-highest rounded-lg cursor-pointer transition-colors'
  : state === 'locked'    ? 'text-on-surface-variant opacity-60 cursor-not-allowed'
  : /* planned */           'text-on-surface-variant opacity-50';

  const title =
    state === 'locked' ? 'Pass the previous step to unlock'
  : state === 'planned' ? 'Coming soon — not yet implemented in this build'
  : undefined;

  const content = (
    <>
      <Bullet state={state} />
      <span className="font-body-md text-body-md truncate flex-1">{label}</span>
    </>
  );

  // Non-actionable rows (locked, planned, the active 'current') render as
  // <li> so they're not picked up as buttons by the keyboard / SR. Only
  // actionable rows (available, passed) get a <button>.
  if (!onSelect) {
    return (
      <li
        className={`mx-2 px-3 py-2 flex items-center gap-3 ${rowClass}`}
        title={title}
        aria-current={state === 'current' ? 'page' : undefined}
      >
        {content}
      </li>
    );
  }
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left mx-2 px-3 py-2 flex items-center gap-3 ${rowClass}`}
        title={title}
      >
        {content}
      </button>
    </li>
  );
}

function Bullet({ state }: { state: StepState }) {
  if (state === 'passed') {
    // Filled green check from Material Symbols. Same icon-as-bullet trick
    // as the "Certificate" entry to keep the visual language consistent.
    return (
      <span
        className="material-symbols-outlined text-pass text-sm shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
        aria-label="passed"
      >
        check_circle
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span
        className="w-2.5 h-2.5 rounded-full bg-tertiary shrink-0 animate-bullet-pulse"
        aria-label="current step"
      />
    );
  }
  if (state === 'available') {
    return (
      <span
        className="w-2.5 h-2.5 rounded-full border border-on-surface-variant shrink-0 transition-colors"
        aria-label="available step"
      />
    );
  }
  if (state === 'locked') {
    return (
      <span
        className="material-symbols-outlined text-on-surface-variant text-sm shrink-0 opacity-80"
        aria-label="locked — finish previous step"
      >
        lock
      </span>
    );
  }
  // planned
  return (
    <span
      className="w-2.5 h-2.5 rounded-full border border-dashed border-on-surface-variant shrink-0"
      aria-label="planned"
    />
  );
}
