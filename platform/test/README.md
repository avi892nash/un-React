# Platform tests

Three layers, all using Node's built-in test runner (`node --test`) with the `tsx` loader so TypeScript modules in `src/` can be imported directly, plus `jsdom` for DOM globals.

| File | What it covers |
|---|---|
| `diff.test.ts` | `lib/diff.ts` — structural DOM compare, whitespace/attr-order tolerance, useful divergence paths |
| `transform.test.ts` | `lib/transform.ts` — Babel JSX → `UnReact.createElement` + compile-error path |
| `verify-steps.test.ts` | End-to-end curriculum check — for **every** step, runs `prevCode + solution + hostCode + render(jsxChallenge)` through the same pipeline the browser uses (Babel → eval in jsdom → diff against `expectedHtml`). Also asserts the **starter** code does NOT accidentally pass. |

The third file is the most important: it's the offline guardrail that prevents authoring drift. If a step is added or edited and its solution doesn't actually produce the expected HTML, CI fails.

## Running

```bash
cd platform
npm install   # one-time, installs jsdom devDep
npm test
```

## Adding a new step

1. Create `src/steps/NN-name.js` exporting the canonical Step shape.
2. Append it to `src/steps/index.js`.
3. Run `npm test` — `verify-steps.test.mjs` will automatically pick it up and assert both the solution passes and the starter doesn't.

No other test changes needed unless the new step exercises a previously-untested branch of `diff.js` or `transform.js`.
