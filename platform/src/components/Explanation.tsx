import { useMemo } from 'react';
import { marked } from 'marked';

interface Props {
  markdown: string;
}

/**
 * Renders the step's concept text. Marked is fine to use here because the
 * input is author-controlled (step files), never user input.
 */
export function Explanation({ markdown }: Props) {
  const html = useMemo(() => marked.parse(markdown, { async: false }) as string, [markdown]);
  return (
    <>
      <div
        className="prose-explanation space-y-3 text-on-surface-variant font-body-lg text-body-lg max-w-2xl"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style>{`
        .prose-explanation :first-child { margin-top: 0; }
        .prose-explanation :last-child { margin-bottom: 0; }
        .prose-explanation code {
          background: #25252b;
          color: #ececef;
          padding: 1px 6px;
          border-radius: 3px;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 0.85em;
        }
        .prose-explanation pre {
          background: #0a0a0d;
          border: 1px solid #2f2f37;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          overflow-x: auto;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 13px;
        }
        .prose-explanation pre code {
          background: transparent;
          padding: 0;
          color: #ececef;
        }
        .prose-explanation strong { color: #ececef; }
      `}</style>
    </>
  );
}
