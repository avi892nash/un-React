// End-to-end curriculum check — for every step, build the same bundle the
// browser pipeline builds (prevCode + USER_CODE + hostCode + render call),
// run it through Babel, evaluate it inside a jsdom window, snapshot
// #root.innerHTML, and structurally diff against step.expectedHtml.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import type { Step } from '../src/types';
import { transform } from '../src/lib/transform';
import steps from '../src/steps';

// diff.ts needs DOMParser + Node as globals — shim from a base jsdom.
const baseDom = new JSDOM();
(globalThis as any).DOMParser = baseDom.window.DOMParser;
(globalThis as any).Node = baseDom.window.Node;
const { structuralDiff } = await import('../src/lib/diff');

interface RunBundleResult {
  ok: boolean;
  html: string;
  error: string | null;
}

async function runBundle(step: Step, userCode: string): Promise<RunBundleResult> {
  const renderCall =
    `\n;UnReact.render(${step.jsxChallenge}, document.getElementById('root'));`;
  const src = step.prevCode + '\n' + userCode + '\n' + step.hostCode + renderCall;

  const { code, error } = transform(src);
  if (error || !code) {
    return { ok: false, error: 'compile: ' + (error ?? 'no code'), html: '' };
  }

  const dom = new JSDOM(
    `<!DOCTYPE html><html><body><div id="root"></div></body></html>`,
    { runScripts: 'outside-only' },
  );
  // Forward-compat shim for fiber-based steps that use requestIdleCallback.
  (dom.window as any).requestIdleCallback = (cb: any) =>
    setTimeout(() => cb({ timeRemaining: () => 50 }), 0);

  try {
    dom.window.eval(code);
  } catch (e) {
    return {
      ok: false,
      error: 'runtime: ' + (e instanceof Error ? e.message : String(e)),
      html: '',
    };
  }

  await new Promise((r) => setTimeout(r, step.settleMs + 5));
  const html = dom.window.document.getElementById('root')?.innerHTML ?? '';
  return { ok: true, html, error: null };
}

assert.ok(steps.length > 0, 'No steps registered in src/steps/index.ts');

for (const step of steps) {
  test(`[${step.id}] solution renders the expected HTML`, async () => {
    const r = await runBundle(step, step.solution);
    assert.equal(r.ok, true, r.error ?? '(no error)');
    const d = structuralDiff(r.html, step.expectedHtml);
    assert.equal(
      d.equal,
      true,
      d.equal
        ? ''
        : `mismatch at ${d.path}\n  expected: ${d.expected}\n  actual:   ${d.actual}\n  full HTML: ${r.html}`,
    );
  });

  test(`[${step.id}] starter code does NOT pass`, async () => {
    const r = await runBundle(step, step.starterCode);
    if (!r.ok) return; // compile / runtime error counts as "doesn't pass"
    const d = structuralDiff(r.html, step.expectedHtml);
    assert.equal(
      d.equal,
      false,
      `starter code unexpectedly passed step ${step.id} — the step is too easy or expectedHtml is wrong`,
    );
  });

  test(`[${step.id}] required fields are present`, () => {
    const required: (keyof Step)[] = [
      'id',
      'title',
      'explanation',
      'starterCode',
      'solution',
      'hostCode',
      'jsxChallenge',
      'expectedHtml',
    ];
    for (const field of required) {
      const v = step[field];
      assert.ok(
        v !== undefined && v !== null && (typeof v !== 'string' || v.length > 0),
        `step ${step.id} is missing required field: ${field}`,
      );
    }
  });
}
