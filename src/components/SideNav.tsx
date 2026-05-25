import type { NavId } from '../types';

interface NavItem {
  id: NavId;
  label: string;
  icon: string;
}

const ITEMS: NavItem[] = [
  { id: 'curriculum', label: 'Curriculum', icon: 'menu_book' },
  { id: 'editor', label: 'Editor', icon: 'code' },
  { id: 'reference', label: 'Reference', icon: 'terminal' },
  { id: 'community', label: 'Community', icon: 'groups' },
];

interface Props {
  active: NavId;
  onSelect: (id: NavId) => void;
}

export function SideNav({ active, onSelect }: Props) {
  return (
    <aside className="flex flex-col h-full p-unit bg-surface-container-low border-r border-outline-variant w-[280px] shrink-0 hidden lg:flex">
      <div className="mb-6 px-4 py-2">
        <div className="font-headline-md text-headline-md text-on-surface font-bold">
          un-React Engine
        </div>
        <div className="font-label-sm text-label-sm text-on-surface-variant opacity-70">
          v0.4.2-beta
        </div>
      </div>
      <nav className="flex flex-col gap-1 px-2">
        {ITEMS.map((it) => {
          const isActive = it.id === active;
          const cls = isActive
            ? 'bg-primary-container text-on-primary-container rounded-lg font-bold'
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg cursor-pointer';
          return (
            <button
              key={it.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelect(it.id)}
              className={`${cls} flex items-center gap-3 px-4 py-3 font-label-sm text-label-sm transition-all text-left select-none`}
            >
              <span className="material-symbols-outlined">{it.icon}</span>
              {it.label}
            </button>
          );
        })}
      </nav>
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
