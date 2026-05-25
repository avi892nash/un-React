import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { ConsoleLine, RunResult, RunState, Step } from '../types';
import { transform } from '../lib/transform';
import { run } from '../lib/sandbox';
import { structuralDiff } from '../lib/diff';
import {
  type PlatformState,
  getStepState,
  updateStep,
} from '../lib/storage';
import { CodeEditor } from './CodeEditor';
import { ChallengePanel } from './ChallengePanel';
import { PreviewPane } from './PreviewPane';
import { VdomViewer } from './VdomViewer';
import { ResultBanner } from './ResultBanner';
import { ConsolePanel } from './ConsolePanel';
import { ActionBar } from './ActionBar';
import { Explanation } from './Explanation';

/**
 * Auto-hint trigger: after this many consecutive failed runs, the next hint
 * is revealed automatically (and the counter resets). Manual hint requests
 * use the same reveal-next-hint path and also reset the counter.
 */
const AUTO_HINT_THRESHOLD = 3;

interface Props {
  step: Step;
  platformState: PlatformState;
  onStateChange: (next: PlatformState) => void;
  /** External imperatives the parent (App) can drive — focus/scroll. */
  exposeApi?: (api: StepViewApi) => void;
}

export interface StepViewApi {
  focusEditor: () => void;
  scrollToTop: () => void;
  setConsoleLines: (lines: ConsoleLine[]) => void;
}

function buildSource(step: Step, userCode: string): string {
  return [
    step.prevCode,
    userCode,
    step.hostCode,
    `\n/** @jsx UnReact.createElement */`,
    `\nconst __element = (${step.jsxChallenge});`,
    `\nconst __root = document.getElementById('root');`,
    `\nUnReact.render(__element, __root);`,
    // Ship the produced virtual-DOM tree back to the parent for the
    // optional VDOM viewer. JSON.stringify to break the structured-clone
    // cycle through fiber refs we may add in later steps. Wrapped in
    // try/catch so this is never the reason a user's code "fails".
    `\ntry {`,
    `\n  parent.postMessage({ type: 'unreact:vdom', tree: JSON.parse(JSON.stringify(__element)) }, '*');`,
    `\n} catch (_) {}`,
  ].join('\n');
}

type Action =
  | { type: 'reset' }
  | { type: 'compiling' }
  | { type: 'running' }
  | { type: 'done'; result: RunResult };

function runStateReducer(_state: RunState, action: Action): RunState {
  switch (action.type) {
    case 'reset': return { kind: 'idle' };
    case 'compiling': return { kind: 'compiling' };
    case 'running': return { kind: 'running' };
    case 'done': return { kind: 'done', result: action.result };
  }
}

const INITIAL_CONSOLE: ConsoleLine[] = [
  { kind: 'system', text: '[un-react] ready. waiting for compile…' },
];

export function StepView({ step, platformState, onStateChange, exposeApi }: Props) {
  // Restore in-progress code from storage if present; otherwise starter.
  const persistedCode = getStepState(platformState, step.id).code;
  const [userCode, setUserCode] = useState(persistedCode ?? step.starterCode);
  const [previewHtml, setPreviewHtml] = useState('');
  const [vdomTree, setVdomTree] = useState<unknown>(null);
  const [runState, dispatch] = useReducer(runStateReducer, { kind: 'idle' });
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>(INITIAL_CONSOLE);

  const leftPaneRef = useRef<HTMLElement | null>(null);
  const editorWrapRef = useRef<HTMLDivElement | null>(null);
  const runningRef = useRef(false);
  // Refs so callbacks can read the latest state without re-binding on every change.
  const platformStateRef = useRef(platformState);
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { platformStateRef.current = platformState; }, [platformState]);
  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

  // Reset state when the step changes (e.g. user navigates curriculum).
  useEffect(() => {
    const persisted = getStepState(platformStateRef.current, step.id).code;
    setUserCode(persisted ?? step.starterCode);
    setPreviewHtml('');
    setVdomTree(null);
    dispatch({ type: 'reset' });
    setConsoleLines(INITIAL_CONSOLE);
  }, [step]);

  // Persist user code on change (debounced ~400ms via setTimeout). Lets the
  // user refresh mid-step without losing their work.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = updateStep(platformStateRef.current, step.id, (prev) => ({
        ...prev,
        code: userCode,
      }));
      onStateChangeRef.current(next);
    }, 400);
    return () => clearTimeout(t);
  }, [userCode, step.id]);

  // Listen for the VDOM postMessage the sandbox sends back after a run.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const data = e.data as { type?: string; tree?: unknown } | undefined;
      if (data?.type === 'unreact:vdom') setVdomTree(data.tree ?? null);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  /** Reveal next hint, push it to the console, reset the failure counter. */
  const revealNextHint = useCallback(
    (auto: boolean): boolean => {
      const cur = getStepState(platformStateRef.current, step.id);
      if (cur.hintsRevealed >= step.hints.length) {
        if (!auto) {
          setConsoleLines([{ kind: 'info', text: '[hint] no more hints — try Reset to start over.' }]);
        }
        return false;
      }
      const hintText = step.hints[cur.hintsRevealed]!;
      const nextRevealed = cur.hintsRevealed + 1;
      const next = updateStep(platformStateRef.current, step.id, (prev) => ({
        ...prev,
        hintsRevealed: nextRevealed,
        failuresSinceLastHint: 0,
      }));
      onStateChangeRef.current(next);
      const header = auto
        ? `[hint ${nextRevealed}/${step.hints.length}] auto-revealed after ${AUTO_HINT_THRESHOLD} failures:`
        : `[hint ${nextRevealed}/${step.hints.length}]`;
      setConsoleLines((prev) => [
        ...prev,
        { kind: auto ? 'system' : 'info', text: header },
        { kind: 'info', text: '  · ' + hintText },
      ]);
      return true;
    },
    [step],
  );

  const runCode = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    dispatch({ type: 'compiling' });
    setConsoleLines([
      { kind: 'system', text: '[un-react] compiling JSX → UnReact.createElement…' },
    ]);
    setPreviewHtml('');

    // Count this attempt up-front so retries that crash mid-run still count.
    onStateChangeRef.current(
      updateStep(platformStateRef.current, step.id, (prev) => ({
        ...prev,
        attempts: prev.attempts + 1,
      })),
    );

    const finishFailure = (failure: RunResult, extraLines: ConsoleLine[]) => {
      dispatch({ type: 'done', result: failure });
      setConsoleLines((prev) => [...prev, ...extraLines]);
      const after = updateStep(platformStateRef.current, step.id, (prev) => ({
        ...prev,
        failuresSinceLastHint: prev.failuresSinceLastHint + 1,
      }));
      onStateChangeRef.current(after);
      // Auto-hint if threshold reached and hints remain.
      const sNow = getStepState(after, step.id);
      if (sNow.failuresSinceLastHint >= AUTO_HINT_THRESHOLD && sNow.hintsRevealed < step.hints.length) {
        revealNextHint(true);
      }
    };

    try {
      const source = buildSource(step, userCode);
      const { code, error: compileError } = transform(source);
      if (compileError || !code) {
        const err = compileError ?? 'unknown compile error';
        finishFailure(
          { pass: false, kind: 'compile', error: err },
          [
            { kind: 'error', text: '[error] compile failed:' },
            { kind: 'error', text: err },
          ],
        );
        return;
      }

      dispatch({ type: 'running' });
      setConsoleLines((prev) => [
        ...prev,
        { kind: 'system', text: '[un-react] compile ok.' },
        { kind: 'system', text: '[un-react] mounting in sandboxed iframe…' },
      ]);

      const result = await run(code, step.settleMs);
      setPreviewHtml(result.html);

      if (!result.ok) {
        const isTimeout = result.error?.includes('timed out') ?? false;
        const failure: RunResult = isTimeout
          ? { pass: false, kind: 'timeout', error: result.error ?? 'timed out' }
          : { pass: false, kind: 'runtime', error: result.error ?? 'unknown error' };
        finishFailure(
          failure,
          [{ kind: 'error', text: (isTimeout ? '[timeout] ' : '[runtime] ') + (result.error ?? '') }],
        );
        return;
      }

      const diff = structuralDiff(result.html, step.expectedHtml);
      if (diff.equal) {
        dispatch({ type: 'done', result: { pass: true } });
        setConsoleLines((prev) => [
          ...prev,
          { kind: 'success', text: '[diff] DOM structurally equal to expected output.' },
          { kind: 'success', text: `[pass] step ${step.id} complete.` },
        ]);
        // Mark passed, record first-pass attempt count.
        const next = updateStep(platformStateRef.current, step.id, (prev) => ({
          ...prev,
          passed: true,
          passedAt: prev.passedAt ?? Date.now(),
          attemptsToFirstPass: prev.attemptsToFirstPass ?? prev.attempts,
          failuresSinceLastHint: 0,
        }));
        onStateChangeRef.current(next);
      } else {
        finishFailure(
          {
            pass: false,
            kind: 'mismatch',
            path: diff.path,
            expected: diff.expected,
            actual: diff.actual,
          },
          [
            { kind: 'error', text: `[diff] mismatch at ${diff.path}` },
            { kind: 'error', text: `  expected: ${diff.expected}` },
            { kind: 'error', text: `  actual:   ${diff.actual}` },
          ],
        );
      }
    } finally {
      runningRef.current = false;
    }
  }, [step, userCode, revealNextHint]);

  // Keyboard shortcut: Cmd/Ctrl + Enter triggers run.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        void runCode();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [runCode]);

  const onReset = useCallback(() => {
    setUserCode(step.starterCode);
    setConsoleLines([{ kind: 'system', text: '[un-react] editor reset to starter code.' }]);
    dispatch({ type: 'reset' });
    setPreviewHtml('');
    setVdomTree(null);
    // Persist the reset code immediately.
    const next = updateStep(platformStateRef.current, step.id, (prev) => ({
      ...prev,
      code: step.starterCode,
    }));
    onStateChangeRef.current(next);
  }, [step]);

  const onHint = useCallback(() => {
    if (step.hints.length === 0) {
      setConsoleLines([{ kind: 'info', text: '[hint] no hints available for this step.' }]);
      return;
    }
    revealNextHint(false);
  }, [step, revealNextHint]);

  // Imperative API for parent (App) so nav clicks can scroll/focus.
  useEffect(() => {
    if (!exposeApi) return;
    exposeApi({
      focusEditor: () => {
        editorWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const cm = editorWrapRef.current?.querySelectorAll('.cm-content');
        const userArea = cm && cm.length ? cm[cm.length - 1] : null;
        if (userArea instanceof HTMLElement) userArea.focus();
      },
      scrollToTop: () => {
        leftPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      },
      setConsoleLines,
    });
  }, [exposeApi]);

  const stepIdParts = step.id.split('-');
  const stepNum = stepIdParts[0] ?? '01';
  const stepSlug = stepIdParts.slice(1).join('-').toUpperCase() || 'STEP';
  const running = runState.kind === 'compiling' || runState.kind === 'running';

  const stepRec = getStepState(platformState, step.id);

  return (
    <div className="h-full flex flex-col bg-surface">
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT 60%: concept + editor + action bar */}
        <section className="w-3/5 h-full flex flex-col border-r border-outline-variant bg-surface min-w-0">
          <div
            ref={(el) => { leftPaneRef.current = el; }}
            className="flex-1 overflow-y-auto px-margin-desktop py-6 space-y-6"
          >
            <div className="space-y-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase font-bold">
                {stepNum} · {stepSlug}
              </span>
              <h1 className="font-headline-xl text-headline-xl text-on-surface">{step.title}</h1>
              <div className="font-label-sm text-label-sm text-on-surface-variant opacity-70">
                attempts {stepRec.attempts}
                {' · '}
                hints {stepRec.hintsRevealed}/{step.hints.length}
                {stepRec.passed && ' · ✓ passed'}
              </div>
            </div>

            <Explanation markdown={step.explanation} />

            <div ref={editorWrapRef} className="h-[420px]">
              <CodeEditor
                filename={`${step.id}.js`}
                prevCode={step.prevCode}
                userCode={userCode}
                onUserCodeChange={setUserCode}
              />
            </div>
          </div>
          <ActionBar
            running={running}
            onRun={() => void runCode()}
            onReset={onReset}
            onHint={onHint}
          />
        </section>

        {/* RIGHT 40%: challenge + preview + banner + console */}
        <section className="w-2/5 h-full flex flex-col bg-surface-container-low overflow-y-auto px-margin-desktop py-6 space-y-5 min-w-0">
          <ChallengePanel jsx={step.jsxChallenge} expectedHtml={step.expectedHtml} />

          <div className="flex-1 flex flex-col space-y-3 min-h-[200px]">
            <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">visibility</span>
              Actual output
            </h3>
            <PreviewPane html={previewHtml} />
          </div>

          {platformState.vdomEnabled && (
            <VdomViewer tree={vdomTree} />
          )}

          <ResultBanner state={runState} />
          <ConsolePanel lines={consoleLines} />
        </section>
      </div>
    </div>
  );
}
