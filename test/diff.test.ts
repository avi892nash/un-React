// Tests for src/lib/diff.ts — the structural DOM comparison that decides
// pass/fail for every step. diff.ts uses the browser globals DOMParser + Node,
// so we shim them from jsdom before importing.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
(globalThis as any).DOMParser = dom.window.DOMParser;
(globalThis as any).Node = dom.window.Node;

const { structuralDiff } = await import('../src/lib/diff');

test('identical HTML is equal', () => {
  assert.deepEqual(structuralDiff('<h1>Hi</h1>', '<h1>Hi</h1>'), { equal: true });
});

test('whitespace inside text is collapsed', () => {
  const r = structuralDiff('<div>  Hi   there  </div>', '<div>Hi there</div>');
  assert.equal(r.equal, true);
});

test('whitespace-only text nodes between elements are ignored', () => {
  const r = structuralDiff(
    '<div>  <p>x</p>  <p>y</p>  </div>',
    '<div><p>x</p><p>y</p></div>',
  );
  assert.equal(r.equal, true);
});

test('HTML comments are ignored', () => {
  const r = structuralDiff('<div><!--x--><p>hi</p></div>', '<div><p>hi</p></div>');
  assert.equal(r.equal, true);
});

test('attribute order is irrelevant', () => {
  const r = structuralDiff(
    '<div id="a" title="b"></div>',
    '<div title="b" id="a"></div>',
  );
  assert.equal(r.equal, true);
});

test('different tag → mismatch with path', () => {
  const r = structuralDiff('<h1>X</h1>', '<h2>X</h2>');
  assert.equal(r.equal, false);
  if (!r.equal) assert.ok(r.path.includes('#root'), `path was ${r.path}`);
});

test('different text → mismatch flagged at [text]', () => {
  const r = structuralDiff('<h1>X</h1>', '<h1>Y</h1>');
  assert.equal(r.equal, false);
  if (!r.equal) {
    assert.match(r.path, /\[text\]/);
    assert.equal(r.expected, '"Y"');
    assert.equal(r.actual, '"X"');
  }
});

test('different attribute value → mismatch flagged at attrs', () => {
  const r = structuralDiff('<div id="a"></div>', '<div id="b"></div>');
  assert.equal(r.equal, false);
  if (!r.equal) assert.match(r.path, /attrs$/);
});

test('extra child → mismatch', () => {
  const r = structuralDiff('<div><p>1</p><p>2</p></div>', '<div><p>1</p></div>');
  assert.equal(r.equal, false);
});

test('missing child → mismatch', () => {
  const r = structuralDiff('<div><p>1</p></div>', '<div><p>1</p><p>2</p></div>');
  assert.equal(r.equal, false);
});

test('nested mismatch reports nested path', () => {
  const r = structuralDiff(
    '<div><section><h1>A</h1></section></div>',
    '<div><section><h1>B</h1></section></div>',
  );
  assert.equal(r.equal, false);
  if (!r.equal) assert.match(r.path, /section.*h1.*\[text\]/);
});

test('empty vs non-empty → mismatch', () => {
  const r = structuralDiff('', '<div/>');
  assert.equal(r.equal, false);
});
