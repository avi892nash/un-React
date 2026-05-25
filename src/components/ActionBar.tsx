interface Props {
  running: boolean;
  onRun: () => void;
  onReset: () => void;
  onHint: () => void;
}

export function ActionBar({ running, onRun, onReset, onHint }: Props) {
  return (
    <footer className="flex items-center justify-end px-margin-desktop gap-gutter bg-surface-container border-t border-outline-variant h-14 shrink-0">
      <button
        type="button"
        onClick={onHint}
        className="text-on-surface-variant flex items-center gap-2 px-4 py-1 hover:text-on-surface hover:bg-surface-container-highest transition-colors font-label-sm text-label-sm uppercase tracking-widest rounded"
      >
        <span className="material-symbols-outlined">lightbulb</span>
        Hint
      </button>
      <button
        type="button"
        onClick={onReset}
        className="text-on-surface-variant flex items-center gap-2 px-4 py-1 hover:text-on-surface hover:bg-surface-container-highest transition-colors font-label-sm text-label-sm uppercase tracking-widest rounded"
      >
        <span className="material-symbols-outlined">restart_alt</span>
        Reset
      </button>
      <button
        type="button"
        onClick={onRun}
        disabled={running}
        className="bg-primary text-on-primary px-5 py-1.5 rounded flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-widest font-bold active:translate-y-0.5 transition-transform shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span
          className={`material-symbols-outlined ${running ? 'animate-spin' : ''}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {running ? 'hourglass_empty' : 'play_arrow'}
        </span>
        {running ? 'Running…' : 'Run'}
        <span className="text-[10px] opacity-60 ml-1 normal-case tracking-normal hidden md:inline">
          ⌘↵
        </span>
      </button>
    </footer>
  );
}
