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
  /** True once every implemented step has been passed at least once. */
  allPassed: boolean;
  /** Which top-level view is active — curriculum or completion. */
  activeView: 'curriculum' | 'completion';
  onSelectStep: (stepId: string) => void;
  onSelectCompletion: () => void;
  onSelectCurriculum: () => void;
}

type StepState = 'current' | 'available' | 'planned';

function stateFor(stepId: string, implemented: Set<string>, currentStepId: string): StepState {
  if (stepId === currentStepId) return 'current';
  if (implemented.has(stepId)) return 'available';
  return 'planned';
}

const TOTAL_STEPS = CURRICULUM.reduce((n, s) => n + s.steps.length, 0);

export function SideNav({
  steps,
  currentStepId,
  allPassed,
  activeView,
  onSelectStep,
  onSelectCompletion,
  onSelectCurriculum,
}: Props) {
  const implemented = new Set(steps.map((s) => s.id));
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
            {availableCount} / {TOTAL_STEPS}
          </span>
        </div>
        <div
          className="h-1 rounded-full bg-surface-container-high overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={availableCount}
          aria-label={`${availableCount} of ${TOTAL_STEPS} steps available`}
        >
          <div
            className="h-full bg-tertiary"
            style={{ width: `${(availableCount / TOTAL_STEPS) * 100}%` }}
          />
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
                const state = activeView === 'completion'
                  ? // When the completion page is active, don't highlight any step as "current"
                    (implemented.has(s.id) ? 'available' : 'planned')
                  : stateFor(s.id, implemented, currentStepId);
                return (
                  <StepRow
                    key={s.id}
                    label={s.label}
                    state={state}
                    onSelect={
                      implemented.has(s.id)
                        ? () => onSelectStep(s.id)
                        : undefined
                    }
                  />
                );
              })}
            </ul>
          </section>
        ))}

        {allPassed && (
          <section className="mt-4">
            <h3 className="px-4 mt-3 mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant opacity-70">
              Completion
            </h3>
            <ul className="flex flex-col">
              <li>
                <button
                  type="button"
                  onClick={onSelectCompletion}
                  className={`w-full mx-2 px-3 py-2 flex items-center gap-3 rounded-lg text-left cursor-pointer ${
                    activeView === 'completion'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  <span className="material-symbols-outlined text-tertiary text-sm">workspace_premium</span>
                  <span className="font-body-md text-body-md truncate">Certificate</span>
                </button>
              </li>
            </ul>
          </section>
        )}
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
  /** Provided only for implemented steps (current + available). */
  onSelect?: () => void;
}) {
  const isCurrent  = state === 'current';
  const isPlanned  = state === 'planned';

  const rowClass = isCurrent
    ? 'bg-primary-container text-on-primary-container rounded-lg'
    : isPlanned
      ? 'text-on-surface-variant opacity-50'
      : 'text-on-surface hover:bg-surface-container-highest rounded-lg cursor-pointer';

  const content = (
    <>
      <Bullet state={state} />
      <span className="font-body-md text-body-md truncate">{label}</span>
    </>
  );

  // Planned (locked) steps render as a non-interactive li; implemented ones
  // render as a button so the keyboard + screen reader treat them as
  // actionable.
  if (!onSelect) {
    return (
      <li className={`mx-2 px-3 py-2 flex items-center gap-3 ${rowClass}`}>
        {content}
      </li>
    );
  }
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={isCurrent ? 'page' : undefined}
        className={`w-full text-left mx-2 px-3 py-2 flex items-center gap-3 ${rowClass}`}
      >
        {content}
      </button>
    </li>
  );
}

function Bullet({ state }: { state: StepState }) {
  if (state === 'current') {
    return (
      <span
        className="w-2.5 h-2.5 rounded-full bg-tertiary shrink-0"
        aria-label="current step"
      />
    );
  }
  if (state === 'available') {
    return (
      <span
        className="w-2.5 h-2.5 rounded-full border border-on-surface-variant shrink-0"
        aria-label="available step"
      />
    );
  }
  return (
    <span
      className="w-2.5 h-2.5 rounded-full border border-dashed border-on-surface-variant shrink-0"
      aria-label="planned step"
    />
  );
}
