interface Props {
  html: string;
}

export function PreviewPane({ html }: Props) {
  const empty = !html || html.trim().length === 0;
  return (
    <div
      className={`bg-white rounded-lg p-8 min-h-[140px] text-slate-900 shadow-xl overflow-auto flex ${
        empty ? 'items-center justify-center text-center' : 'flex-col gap-2'
      }`}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {empty ? (
        <div className="space-y-2 text-slate-400">
          <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
          <p className="italic uppercase tracking-tight text-sm">no output yet</p>
        </div>
      ) : (
        // The HTML originates from the sandboxed iframe which already executed
        // user code; it can't reach back into the parent (no access here, just
        // a display surface).
        <div dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}
