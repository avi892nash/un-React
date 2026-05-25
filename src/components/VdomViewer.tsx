// Optional preview pane that renders the virtual-DOM tree the user's
// createElement actually produced. Off by default, toggled via Settings.
//
// Pedagogical purpose: in step 1 especially, the only thing the user can
// SEE is the rendered HTML — but the thing they actually WROTE produces a
// JS object tree, which is the entire point of having a virtual DOM. This
// pane makes that artifact visible.

interface Props {
  tree: unknown;
}

export function VdomViewer({ tree }: Props) {
  return (
    <div className="flex flex-col space-y-3 min-h-[120px]">
      <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">account_tree</span>
        Your VDOM tree
      </h3>
      <pre className="bg-surface-container-lowest rounded-lg p-3 text-code-block text-on-surface-variant overflow-auto max-h-[280px] font-code-block leading-snug">
        {tree
          ? renderNode(tree, 0)
          : <span className="opacity-60">Run your code to see the createElement output here.</span>}
      </pre>
    </div>
  );
}

/**
 * Pretty-print a VDOM node. Each level indents by 2 spaces; primitives are
 * shown inline. We intentionally don't reuse JSON.stringify(_, null, 2)
 * because we want children to lay out one-per-line with their tag visible.
 */
function renderNode(node: unknown, depth: number): string {
  if (node === null || node === undefined) return String(node);
  if (typeof node !== 'object') return JSON.stringify(node);
  const obj = node as { type?: unknown; props?: { children?: unknown[]; nodeValue?: unknown; [k: string]: unknown } };
  const indent = '  '.repeat(depth);
  const type = obj.type;
  const props = (obj.props ?? {}) as Record<string, unknown>;
  const { children = [], ...rest } = props as { children?: unknown[]; [k: string]: unknown };

  // TEXT_ELEMENT special-case: render as a quoted string for readability.
  if (type === 'TEXT_ELEMENT') {
    return `${indent}"${String((rest as { nodeValue?: unknown }).nodeValue ?? '')}"`;
  }

  // Format attributes (everything other than children) on one line.
  const attrKeys = Object.keys(rest);
  const attrStr = attrKeys.length === 0
    ? ''
    : ' ' + attrKeys.map((k) => `${k}=${JSON.stringify(rest[k])}`).join(' ');

  const head = `${indent}<${String(type)}${attrStr}>`;
  const kids = Array.isArray(children) ? children : [];
  if (kids.length === 0) return head;
  const body = kids.map((c) => renderNode(c, depth + 1)).join('\n');
  return `${head}\n${body}`;
}
