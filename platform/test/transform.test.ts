// Tests for src/lib/transform.ts — Babel JSX → UnReact.createElement.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transform } from '../src/lib/transform';

test('simple JSX → UnReact.createElement call', () => {
  const { code, error } = transform('const x = <h1>Hi</h1>;');
  assert.equal(error, null);
  assert.ok(code);
  assert.match(code!, /UnReact\.createElement\(\s*"h1"/);
});

test('JSX attributes survive the transform', () => {
  const { code, error } = transform('const x = <div id="a" className="b">x</div>;');
  assert.equal(error, null);
  assert.ok(code);
  assert.match(code!, /id:\s*"a"/);
  assert.match(code!, /className:\s*"b"/);
});

test('nested JSX produces nested calls', () => {
  const { code, error } = transform('const x = <div><span/></div>;');
  assert.equal(error, null);
  assert.ok(code);
  assert.match(
    code!,
    /UnReact\.createElement\(\s*"div"[\s\S]*UnReact\.createElement\(\s*"span"/,
  );
});

test('JSX expression children pass through as expressions', () => {
  const { code, error } = transform('const x = <h1>{count}</h1>;');
  assert.equal(error, null);
  assert.ok(code);
  assert.match(code!, /UnReact\.createElement\(\s*"h1"[\s\S]*count/);
});

test('plain JS without JSX is returned unchanged in shape', () => {
  const { code, error } = transform('const x = 1 + 2;');
  assert.equal(error, null);
  assert.ok(code);
  assert.match(code!, /1\s*\+\s*2/);
});

test('syntax error returns { code: null, error: string }', () => {
  const { code, error } = transform('const x = <h1>;');
  assert.equal(code, null);
  assert.equal(typeof error, 'string');
  assert.ok(error && error.length > 0);
});

test('uses UnReact.createElement pragma, not React.createElement', () => {
  const { code } = transform('const x = <h1/>;');
  assert.ok(code);
  assert.doesNotMatch(code!, /\bReact\.createElement\b/);
  assert.match(code!, /UnReact\.createElement/);
});
