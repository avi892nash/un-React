// Settings dialog — opened from the TopBar gear icon. Holds user-tweakable
// platform preferences. Today: just the VDOM viewer toggle.
//
// Click-outside-to-close + Esc-to-close. The current ShadowRoot-style
// modal is kept simple on purpose — no router state, no portal — because
// we have a single setting and don't want to add a UI library for it.

import { useEffect } from 'react';
import type { PlatformState } from '../lib/storage';

interface Props {
  platformState: PlatformState;
  onStateChange: (next: PlatformState) => void;
  onClose: () => void;
}

export function SettingsDialog({ platformState, onStateChange, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setVdomEnabled = (next: boolean) => {
    onStateChange({ ...platformState, vdomEnabled: next });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-rise-in"
      onClick={onClose}
    >
      <div
        className="bg-surface-container rounded-xl border border-outline-variant p-6 w-[480px] max-w-[92vw] space-y-5 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-3">
          <Toggle
            label="Show VDOM tree"
            description="Add a panel that pretty-prints the virtual-DOM object your createElement returns, alongside the rendered HTML."
            checked={platformState.vdomEnabled}
            onChange={setVdomEnabled}
          />
        </div>

        <div className="pt-2 border-t border-outline-variant text-on-surface-variant text-xs opacity-70">
          More options will land as the curriculum grows — font size, autorun on save, theme.
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 accent-tertiary cursor-pointer shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-on-surface font-bold text-body-md">{label}</div>
        <div className="text-on-surface-variant text-body-md opacity-80">{description}</div>
      </div>
    </label>
  );
}
