import { CodeMirrorEditor } from './CodeMirrorEditor';

interface Props {
  filename: string;
  prevCode: string;
  userCode: string;
  onUserCodeChange: (v: string) => void;
}

/**
 * The IDE-style card containing two editors: a read-only "previous steps"
 * region above the user's editable slot. The locked region collapses when
 * there's no prev code (step 1).
 */
export function CodeEditor({ filename, prevCode, userCode, onUserCodeChange }: Props) {
  const hasPrev = prevCode.trim().length > 0;

  return (
    <div className="hairline-border bg-surface-container-lowest rounded overflow-hidden flex flex-col h-full min-h-[300px]">
      <div className="bg-surface-container h-10 px-4 flex items-center justify-between border-b border-outline-variant shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-error opacity-40" />
          <span className="w-3 h-3 rounded-full bg-tertiary opacity-40" />
          <span className="w-3 h-3 rounded-full bg-pass opacity-40" />
          <span className="ml-4 font-label-sm text-label-sm text-on-surface-variant">
            {filename}
          </span>
        </div>
      </div>

      {hasPrev && (
        <>
          <div className="px-4 py-1.5 bg-surface-container-low border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant flex items-center gap-2 opacity-60">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            previous code (read-only)
          </div>
          <div className="overflow-auto border-b border-outline-variant max-h-[30vh]">
            <CodeMirrorEditor value={prevCode} readOnly />
          </div>
        </>
      )}

      <div className="px-4 py-1.5 bg-surface-container-low border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
        <span className="material-symbols-outlined text-[14px] text-primary">edit</span>
        your code (this step)
      </div>

      <div className="flex-1 overflow-auto min-h-[200px]">
        <CodeMirrorEditor value={userCode} onChange={onUserCodeChange} />
      </div>
    </div>
  );
}
