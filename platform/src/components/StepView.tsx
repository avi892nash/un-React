import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { ConsoleLine, RunResult, RunState, Step } from '../types';
import { transform } from '../lib/transform';
import { run } from '../lib/sandbox';
import { structuralDiff } from '../lib/diff';
import { CodeEditor } from './CodeEditor';
import { ChallengePanel } from './ChallengePanel';
import { PreviewPane } from './PreviewPane';
import { ResultBanner } from './ResultBanner';
import { ConsolePanel } from './ConsolePanel';
import { ActionBar } from './ActionBar';
import { Explanation } from './Explanation';

interface Props {
  step: Step;
  // External imperatives, owned by App: focus the editor, scroll back to top.
  // We expose them via the ref the parent can attach for nav-driven actions.
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

export function StepView({ step, exposeApi }: Props) {
  const [userCode, setUserCode] = useState(step.starterCode);
  const [previewHtml, setPreviewHtml] = useState('');
  const [runState, dispatch] = useReducer(runStateReducer, { kind: 'idle' });
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>(INITIAL_CONSOLE);

  const leftPaneRef = useRef<HTMLElement | null>(null);
  const editorWrapRef = useRef<HTMLDivElement | null>(null);
  const runningRef = useRef(false);

  // Reset state when the step changes (e.g. user navigates curriculum).
  useEffect(() => {
    setUserCode(step.starterCode);
    setPreviewHtml('');
    dispatch({ type: 'reset' });
    setConsoleLines(INITIAL_CONSOLE);
  }, [step]);

  const runCode = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    dispatch({ type: 'compiling' });
    setConsoleLines([
      { kind: 'system', text: '[un-react] compiling JSX → UnReact.createElement…' },
    ]);
    setPreviewHtml('');

    try {
      const source = buildSource(step, userCode);
      const { code, error: compileError } = transform(source);
      if (compileError || !code) {
        const err = compileError ?? 'unknown compile error';
        dispatch({ type: 'done', result: { pass: false, kind: 'compile', error: err } });
        setConsoleLines([
          { kind: 'system', text: '[un-react] compiling JSX → UnReact.createElement…' },
          { kind: 'error', text: '[error] compile failed:' },
          { kind: 'error', text: err },
        ]);
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
        dispatch({ type: 'done', result: failure });
        setConsoleLines((prev) => [
          ...prev,
          { kind: 'error', text: (isTimeout ? '[timeout] ' : '[runtime] ') + (result.error ?? '') },
        ]);
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
      } else {
        dispatch({
          type: 'done',
          result: {
            pass: false,
            kind: 'mismatch',
            path: diff.path,
            expected: diff.expected,
            actual: diff.actual,
          },
        });
        setConsoleLines((prev) => [
          ...prev,
          { kind: 'error', text: `[diff] mismatch at ${diff.path}` },
          { kind: 'error', text: `  expected: ${diff.expected}` },
          { kind: 'error', text: `  actual:   ${diff.actual}` },
        ]);
      }
    } finally {
      runningRef.current = false;
    }
  }, [step, userCode]);

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
  }, [step]);

  const onHint = useCallback(() => {
    if (step.hints.length === 0) {
      setConsoleLines([{ kind: 'info', text: '[hint] no hints available for this step.' }]);
      return;
    }
    setConsoleLines([
      { kind: 'system', text: '[hint] suggestions:' },
      ...step.hints.map<ConsoleLine>((h) => ({ kind: 'info', text: '  · ' + h })),
    ]);
  }, [step]);

  // Imperative API for parent (App) so nav clicks can scroll/focus.
  useEffect(() => {
    if (!exposeApi) return;
    exposeApi({
      focusEditor: () => {
        editorWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Focus the first .cm-content inside the user-code editor wrapper.
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

          <ResultBanner state={runState} />
          <ConsolePanel lines={consoleLines} />
        </section>
      </div>
    </div>
  );
}
