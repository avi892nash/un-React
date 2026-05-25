// The sidebar is intentionally minimal until there's more than one step
// in the curriculum to navigate to. Header carries the logo + version
// for identity; footer carries the user identity.

export function SideNav() {
  return (
    <aside className="flex flex-col h-full p-unit bg-surface-container-low border-r border-outline-variant w-[280px] shrink-0 hidden lg:flex">
      <div className="mb-6 px-4 py-4 flex items-center gap-3">
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
      </div>
      <div className="mt-auto p-4 flex items-center gap-3 border-t border-outline-variant">
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
