interface Props {
  step: number;
  total: number;
  onHelp: () => void;
  onSettings: () => void;
  /** Toggle the slide-in drawer sidebar — only relevant below the lg
   *  breakpoint where the sidebar is hidden by default. */
  onToggleSidebar: () => void;
}

export function TopBar({ step, total, onHelp, onSettings, onToggleSidebar }: Props) {
  return (
    <header className="bg-surface-container border-b border-outline-variant flex justify-between items-center px-margin-desktop w-full h-12 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — opens the SideNav drawer at <lg. The fixed sidebar at
            lg+ doesn't need this control, so the button is hidden there. */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Open navigation"
          className="p-2 -ml-2 xl:hidden text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg cursor-pointer"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="font-headline-md text-headline-md font-bold text-on-surface">un-React</span>
        {/* Tagline drops at <md so the narrow TopBar has room for the
            "Step N of M" badge without wrapping. */}
        <span className="text-on-surface-variant font-medium text-body-md hidden md:inline truncate">
          build your own React, one step at a time
        </span>
      </div>
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        <span className="text-primary font-bold border-b-2 border-primary font-headline-md text-headline-md tracking-tight whitespace-nowrap">
          Step {step} of {total}
        </span>
        <div className="flex gap-1 sm:gap-2">
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
