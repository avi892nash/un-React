interface Props {
  step: number;
  total: number;
  onHelp: () => void;
  onSettings: () => void;
}

export function TopBar({ step, total, onHelp, onSettings }: Props) {
  return (
    <header className="bg-surface-container border-b border-outline-variant flex justify-between items-center px-margin-desktop w-full h-12 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <span className="font-headline-md text-headline-md font-bold text-on-surface">un-React</span>
        <span className="text-on-surface-variant font-medium text-body-md hidden md:inline">
          build your own React, one step at a time
        </span>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-primary font-bold border-b-2 border-primary font-headline-md text-headline-md tracking-tight">
          Step {step} of {total}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onHelp}
            aria-label="Help"
            className="p-2 hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <button
            type="button"
            onClick={onSettings}
            aria-label="Settings"
            className="p-2 hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
