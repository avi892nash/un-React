# Claude design prompt — un-React tutorial platform

> Copy everything below the line into Claude (claude.ai) and ask it to produce the design as an HTML artifact. It's tuned for a one-shot generation that returns a high-fidelity, self-contained mock you can iterate on.

---

Design a high-fidelity visual mock of an interactive tutorial website called **un-React** that teaches developers how to build a React-like framework from scratch. The output should be a single self-contained HTML artifact with inline CSS, no external fonts, no external images, no JavaScript needed (this is a static visual mock, not a working app).

## Product in one paragraph

A learner moves through ~8 steps. At each step they read a short concept on the left, write code in an editor below it, click **Run**, and the platform executes their code in a sandboxed iframe and structurally compares the rendered DOM to an expected output shown on the right. Pass → next step unlocks. Fail → show the divergence. The audience is working JavaScript developers (1–10 yrs experience). They already know JSX, hooks, the DOM. The tone is the opposite of a Codecademy lesson — terse, confident, no exclamation marks, no emoji, no celebratory chrome. Closer to a Kernighan book than a Duolingo screen.

## What to design

A single screen (the **step view**) shown in **four result states**, stacked vertically as four full-width frames in the artifact, each labeled at the top:

1. **Idle** (no run yet)
2. **Pass** (green confirmation)
3. **Mismatch** (red, with a structural diff path)
4. **Runtime error** (red, with a JS error message)

All four frames share the same layout — only the right-side result banner changes.

## Layout (per frame)

A two-column split, **60% left / 40% right**, on a **dark background** (system dark, near-black). Designed for **1280×800** viewport.

**LEFT column** (top to bottom):

- Header strip: small caps wordmark "un-React" + tagline "build your own React, one step at a time" on the far left; "step 1 of 8" indicator on the far right. Hairline divider below.
- Step label: "01 · CREATE-ELEMENT" in muted small caps.
- Step title: "createElement — building the virtual DOM" (large, bold).
- Concept (rendered markdown, ~120 words):
  > React's first job is to turn JSX into plain JavaScript objects — a *virtual DOM*. The Babel plugin transforms `<h1>Hello</h1>` into a function call: `UnReact.createElement("h1", null, "Hello")`. Your job is to implement `createElement` so it returns a node with `type` and `props` (props should include `children`, with any string children wrapped via `createTextElement`).
- Editor section labeled "YOUR CODE (THIS STEP)":
  - A single editor card with **two visually distinct regions stacked vertically inside it**:
    - **Top region (locked / read-only)**: shown with a slightly muted background tint and a small lock icon + "previous code" caption. For step 1 this region is empty (placeholder: "no previous code yet — this is the first step"); for later steps it would contain accumulated prior code. Make the visual treatment work for both cases.
    - **Bottom region (editable, larger)**: pre-filled with this TODO scaffold, syntax-highlighted as JavaScript:
      ```js
      function createElement(type, props, ...children) {
        // TODO: return { type, props: { ...props, children: [...normalized] } }
      }

      function createTextElement(value) {
        // TODO: return { type: "TEXT_ELEMENT", props: { nodeValue: value, children: [] } }
      }
      ```
  - Action bar pinned to the editor: a prominent **Run** button (primary, the loudest element on screen, with a small "⌘↵" keyboard hint), a quieter **Reset** button, and a tertiary **Hint** link.

**RIGHT column** (top to bottom):

- Card titled "JSX CHALLENGE — RENDER THIS" containing this code block:
  ```jsx
  <div>
    <h1>Hello, un-React!</h1>
    <p>You just built a virtual DOM.</p>
  </div>
  ```
- Card titled "EXPECTED HTML OUTPUT" containing: `<div><h1>Hello, un-React!</h1><p>You just built a virtual DOM.</p></div>`
- A larger card titled "YOUR CODE'S ACTUAL OUTPUT" with a **white** background (a deliberate focal point against the dark theme). This is where the iframe preview renders. Per state:
  - Idle: muted "no output yet" placeholder.
  - Pass / mismatch: shows a rendered `<h1>Hello, un-React!</h1>` and `<p>You just built a virtual DOM.</p>`.
  - Runtime error: stays empty / "no output".
- **Result banner** (this is the key state-dependent element):
  - **Idle**: neutral gray border, plain text "Click **Run** to test your code."
  - **Pass**: green left border + faint green tint, label "Pass", description "Your code produces the expected output.", and a subtle "Next step →" link on the right.
  - **Mismatch**: red left border + faint red tint, label "Mismatch", monospace path "`#root > div > h1 > [text]`", and below: "expected `\"Hello, un-React!\"`, got `\"hello\"`".
  - **Runtime error**: red left border, label "Runtime error", monospace error: "`Cannot read properties of undefined (reading 'type')`".

## Visual system

- **Background**: very dark, not pure black (something like #0b0b0d). Cards a tone above (#141417). Editor a tone above that (#1a1a1e).
- **Text**: high-contrast white for headings, ~75% white for body, ~50% for captions and small caps labels.
- **Accent (primary action)**: choose ONE confident accent color (a slightly desaturated electric blue, violet, or cyan — your call, pick one and use it consistently for the Run button and focus rings).
- **Semantic colors**: green for pass, red for fail, amber reserved for warnings (not used in these four states).
- **Type**: pair a clean sans-serif (Inter or system-ui) for prose UI with a monospace (JetBrains Mono / Fira Code / system mono) for ALL code. No display fonts. No serif.
- **Spacing**: 8px base. Generous padding inside cards.
- **Borders**: hairline (1px, low-opacity white) where needed to separate surfaces. Avoid drop shadows — this is a developer tool, not a SaaS dashboard.
- **Shape**: subtle 6–8px corner radii. Nothing pill-shaped.

## Hard constraints

- **No emoji anywhere** in the UI text. (You may use simple inline SVG icons — lock, arrow, keyboard — at small sizes in muted gray.)
- **No marketing chrome**: no hero gradient, no testimonials, no "trusted by" logos, no avatars.
- **No celebratory animation copy**: pass state says "Pass", not "Awesome!" or "🎉 Great job!".
- **Color cannot be the only signal** for pass/fail: include text labels and small icon shapes in the result banners so it survives a colorblind viewing.
- **Dark theme only**. No light theme variant.
- **Accessibility**: ensure all text meets WCAG AA contrast against its background.

## Output

Return **one HTML artifact** containing all four state frames stacked vertically (with a small label above each: "Idle", "Pass", "Mismatch", "Runtime error"). Use only inline `<style>` and inline SVG. The artifact should be visually complete and ready to screenshot for handoff — no half-styled placeholders. After the artifact, add a short "Design notes" section (under 150 words) explaining your choices for the accent color, the locked-region treatment, and the result-banner shape system.
