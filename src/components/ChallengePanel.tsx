interface Props {
  jsx: string;
  expectedHtml: string;
}

export function ChallengePanel({ jsx, expectedHtml }: Props) {
  return (
    <>
      <div className="space-y-3">
        <h3 className="font-headline-md text-headline-md text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">flag</span>
          Challenge — render this
        </h3>
        <pre className="bg-[#1a1a1e] hairline-border p-4 rounded font-code-block text-code-block text-on-surface m-0 whitespace-pre overflow-x-auto">
          {jsx}
        </pre>
      </div>

      <div className="space-y-3 mt-4">
        <h3 className="font-headline-md text-headline-md text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">checklist</span>
          Expected HTML
        </h3>
        <pre className="bg-surface-container hairline-border p-4 rounded font-code-block text-code-block text-on-surface-variant opacity-80 m-0 whitespace-pre-wrap break-words">
          {expectedHtml}
        </pre>
      </div>
    </>
  );
}
