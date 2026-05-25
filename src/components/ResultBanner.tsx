import type { RunResult, RunState } from '../types';

interface Preset {
  border: string;
  bg: string;
  iconColor: string;
  titleColor: string;
  icon: string;
  title: string;
  filled: boolean;
}

const PRESETS = {
  idle:    { border: 'border-outline-variant', bg: 'bg-surface-container-highest/30', iconColor: 'text-on-surface-variant', titleColor: 'text-on-surface-variant', icon: 'info',          title: 'Ready',          filled: false },
  pass:    { border: 'border-pass',            bg: 'bg-pass-container',                iconColor: 'text-pass',              titleColor: 'text-pass',              icon: 'check_circle',  title: 'Pass',           filled: true  },
  fail:    { border: 'border-error',           bg: 'bg-error-container/10',            iconColor: 'text-error',             titleColor: 'text-error',             icon: 'error_outline', title: 'Mismatch',       filled: false },
  runtime: { border: 'border-error',           bg: 'bg-error-container/10',            iconColor: 'text-error',             titleColor: 'text-error',             icon: 'bug_report',    title: 'Runtime error',  filled: false },
  compile: { border: 'border-tertiary',        bg: 'bg-tertiary-container/20',         iconColor: 'text-tertiary',          titleColor: 'text-tertiary',          icon: 'code_off',      title: 'Compile error',  filled: false },
  timeout: { border: 'border-tertiary',        bg: 'bg-tertiary-container/20',         iconColor: 'text-tertiary',          titleColor: 'text-tertiary',          icon: 'timer_off',     title: 'Timed out',      filled: false },
  busy:    { border: 'border-outline',         bg: 'bg-surface-container-highest/30',  iconColor: 'text-on-surface-variant',titleColor: 'text-on-surface',        icon: 'autorenew',     title: 'Working…',       filled: false },
} satisfies Record<string, Preset>;

interface Props {
  state: RunState;
}

function presetFor(state: RunState): { preset: Preset; result?: RunResult } {
  if (state.kind === 'idle') return { preset: PRESETS.idle };
  if (state.kind === 'compiling' || state.kind === 'running')
    return { preset: PRESETS.busy };
  const r = state.result;
  if (r.pass) return { preset: PRESETS.pass, result: r };
  switch (r.kind) {
    case 'mismatch': return { preset: PRESETS.fail,    result: r };
    case 'runtime':  return { preset: PRESETS.runtime, result: r };
    case 'compile':  return { preset: PRESETS.compile, result: r };
    case 'timeout':  return { preset: PRESETS.timeout, result: r };
  }
}

export function ResultBanner({ state }: Props) {
  const { preset, result } = presetFor(state);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`p-4 rounded border-l-4 ${preset.border} ${preset.bg} flex items-start gap-3`}
    >
      <span
        className={`material-symbols-outlined ${preset.iconColor} shrink-0 mt-0.5`}
        style={preset.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {preset.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={`font-bold ${preset.titleColor} uppercase tracking-wider text-label-sm font-label-sm mb-1`}
        >
          {preset.title}
        </p>
        <Body state={state} result={result} />
      </div>
      {result && result.pass && (
        <a
          href="#"
          className="text-primary hover:underline flex items-center gap-1 font-bold whitespace-nowrap ml-4"
        >
          Next step <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </a>
      )}
    </div>
  );
}

function Body({ state, result }: { state: RunState; result?: RunResult }) {
  if (state.kind === 'idle') {
    return (
      <p className="text-on-surface-variant font-medium">
        Click <strong className="text-on-surface">Run</strong> to test your code.
      </p>
    );
  }
  if (state.kind === 'compiling') {
    return <p className="text-on-surface-variant">compiling JSX → UnReact.createElement…</p>;
  }
  if (state.kind === 'running') {
    return <p className="text-on-surface-variant">running in sandboxed iframe…</p>;
  }
  if (!result) return null;

  if (result.pass) {
    return (
      <p className="text-on-surface font-medium text-body-md">
        Your code produces the expected output.
      </p>
    );
  }
  if (result.kind === 'mismatch') {
    return (
      <>
        <div className="font-code-inline text-code-inline text-on-surface-variant bg-surface-container px-2 py-1 rounded mt-1 mb-2 inline-block break-all">
          {result.path}
        </div>
        <p className="text-on-error-container text-body-md break-words">
          expected <span className="text-primary font-medium">{result.expected}</span>, got{' '}
          <span className="text-error font-medium">{result.actual}</span>
        </p>
      </>
    );
  }
  if (result.kind === 'runtime') {
    return (
      <pre className="font-code-block text-code-block text-on-error-container whitespace-pre-wrap break-words m-0">
        {result.error}
      </pre>
    );
  }
  if (result.kind === 'compile') {
    return (
      <pre className="font-code-block text-code-block text-on-tertiary-container whitespace-pre-wrap break-words m-0">
        {result.error}
      </pre>
    );
  }
  if (result.kind === 'timeout') {
    return (
      <pre className="font-code-block text-code-block text-on-tertiary-container whitespace-pre-wrap break-words m-0">
        {result.error}
      </pre>
    );
  }
  return null;
}
