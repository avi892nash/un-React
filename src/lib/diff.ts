// Structural DOM compare for the actual vs expected render. Tolerant of
// whitespace, comments, and attribute order. Returns the first divergence
// path so the UI can render a useful "mismatch at <path>" message.

export type DiffResult =
  | { equal: true }
  | { equal: false; path: string; expected: string; actual: string };

function parseFragment(html: string): HTMLElement | null {
  const doc = new DOMParser().parseFromString(
    `<!DOCTYPE html><body><div id="__r">${html}</div>`,
    'text/html',
  );
  return doc.getElementById('__r');
}

function normalizeText(s: string | null | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

function attrsOf(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    out[attr.name.toLowerCase()] = attr.value;
  }
  return out;
}

function eqAttrs(a: Record<string, string>, b: Record<string, string>): boolean {
  const ak = Object.keys(a).sort();
  const bk = Object.keys(b).sort();
  if (ak.length !== bk.length) return false;
  for (let i = 0; i < ak.length; i++) {
    if (ak[i] !== bk[i]) return false;
    const k = ak[i]!;
    if (a[k] !== b[k]) return false;
  }
  return true;
}

function describeNode(n: Node | null | undefined): string {
  if (!n) return 'nothing';
  if (n.nodeType === Node.TEXT_NODE) return `text "${normalizeText(n.nodeValue)}"`;
  if (n.nodeType === Node.ELEMENT_NODE) {
    const el = n as Element;
    const id = el.id ? `#${el.id}` : '';
    return `<${el.nodeName.toLowerCase()}${id}>`;
  }
  return n.nodeName;
}

function nonEmptyChildren(parent: Node): Node[] {
  return Array.from(parent.childNodes).filter((n) => {
    if (n.nodeType === Node.TEXT_NODE) return normalizeText(n.nodeValue).length > 0;
    if (n.nodeType === Node.COMMENT_NODE) return false;
    return true;
  });
}

function walk(actual: Node | null, expected: Node | null, path: string): DiffResult {
  const aIsText = !!actual && actual.nodeType === Node.TEXT_NODE;
  const eIsText = !!expected && expected.nodeType === Node.TEXT_NODE;

  if (aIsText !== eIsText) {
    return {
      equal: false,
      path,
      expected: describeNode(expected),
      actual: describeNode(actual),
    };
  }

  if (eIsText) {
    const a = normalizeText(actual!.nodeValue);
    const e = normalizeText(expected!.nodeValue);
    if (a !== e) {
      return {
        equal: false,
        path: `${path} > [text]`,
        expected: `"${e}"`,
        actual: `"${a}"`,
      };
    }
    return { equal: true };
  }

  if (!actual || !expected) {
    return {
      equal: false,
      path,
      expected: describeNode(expected),
      actual: describeNode(actual),
    };
  }

  const aEl = actual as Element;
  const eEl = expected as Element;
  if (aEl.nodeName.toLowerCase() !== eEl.nodeName.toLowerCase()) {
    return {
      equal: false,
      path,
      expected: describeNode(expected),
      actual: describeNode(actual),
    };
  }

  const aAttrs = attrsOf(aEl);
  const eAttrs = attrsOf(eEl);
  if (!eqAttrs(aAttrs, eAttrs)) {
    return {
      equal: false,
      path: `${path} > attrs`,
      expected: JSON.stringify(eAttrs),
      actual: JSON.stringify(aAttrs),
    };
  }

  const aKids = nonEmptyChildren(actual);
  const eKids = nonEmptyChildren(expected);
  const max = Math.max(aKids.length, eKids.length);
  for (let i = 0; i < max; i++) {
    const ePivot = eKids[i] ?? aKids[i] ?? null;
    const childPath = `${path} > ${describeNode(ePivot)}[${i}]`;
    const r = walk(aKids[i] ?? null, eKids[i] ?? null, childPath);
    if (!r.equal) return r;
  }
  return { equal: true };
}

export function structuralDiff(actualHtml: string, expectedHtml: string): DiffResult {
  const a = parseFragment(actualHtml);
  const e = parseFragment(expectedHtml);
  return walk(a, e, '#root');
}
