import type { ConsoleLine } from '../types';

const COLOR: Record<ConsoleLine['kind'], string> = {
  system: 'text-primary',
  info: 'text-on-surface-variant',
  success: 'text-pass',
  error: 'text-error',
};

interface Props {
  lines: ConsoleLine[];
}

export function ConsolePanel({ lines }: Props) {
  return (
    <div className="bg-[#1a1a1e] border border-outline-variant rounded flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-outline-variant/60 bg-surface-container">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px]">terminal</span>
          <span className="font-label-sm text-label-sm uppercase tracking-widest">
            Compiler log
          </span>
        </div>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-error opacity-50" />
          <span className="w-2.5 h-2.5 rounded-full bg-tertiary opacity-50" />
          <span className="w-2.5 h-2.5 rounded-full bg-pass opacity-50" />
        </div>
      </div>
      <div className="p-3 font-code-block text-code-block space-y-0.5 max-h-32 overflow-auto">
        {lines.map((l, i) => (
          <p key={i} className={`${COLOR[l.kind]} whitespace-pre-wrap break-words`}>
            {l.text}
          </p>
        ))}
        <div className="flex items-center gap-1 mt-1 opacity-60">
          <span className="text-primary">›</span>
          <span className="w-1.5 h-3.5 bg-primary/50 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
