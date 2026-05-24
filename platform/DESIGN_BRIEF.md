# Design brief — un-React tutorial platform

> Hand this entire file to a design agent (Figma MCP, design subagent, or any LLM with the `design:*` skills). It is self-contained — the agent does not need to read other files to produce a first-pass design.

---

## 1. What we're building

An interactive, in-browser tutorial that teaches developers how to build a React-like framework from scratch ("un-React"). The learner moves through ~8 steps; at each step they read a short concept, write a slice of code in an editor, click **Run**, and the platform executes their code in a sandboxed iframe and structurally diffs the rendered DOM against an expected output. Pass → next step unlocks; fail → show the divergence.

The end state of the curriculum is a hand-written ~310-line implementation equivalent to the framework that ships in the repo's root `index.js`.

**What this is NOT**: a generic code playground (CodeSandbox, StackBlitz). It is a *guided* curriculum. The UI must make the linear path obvious and make every step's success criterion legible at a glance.

---

## 2. Audience and tone

- **Audience**: working JS/React developers (1–10 yrs) who want to peek under the hood. They already know JSX, hooks, the DOM. They do NOT need definitions of "virtual DOM" — they need to see the *implementation*.
- **Tone**: confident, terse, opinionated. No exclamation marks. No emoji. No "Awesome! 🎉". Closer to a kernighan-style book than a Codecademy lesson.
- **Voice examples**:
  - ✅ "Two functions to write."
  - ✅ "Pass — your code produces the expected output."
  - ❌ "Great job! 🚀 You're crushing it!"

---

## 3. Functional surface (what screens exist)

### 3.1 Step view (the main screen, 95% of all UX)

A two-column layout. The user spends every minute of the curriculum here.

**LEFT column** (top-to-bottom):
1. **Stepper / breadcrumb** — `01 · createElement` style. Shows current step number, total, and title.
2. **Concept** — markdown-rendered explanation. Includes inline code (`<h1>` style) and short fenced blocks. Expect 100–300 words.
3. **Editor** — two stacked panes:
   - **Locked region** (top) — read-only, grayed background, contains all code accumulated from previously-completed steps. Visually obvious that it's not editable. May be tall (steps 6+ accumulate ~150 lines).
   - **Editable region** (bottom) — the user's slot for *this step's* new code. Pre-filled with a TODO scaffold. Larger relative emphasis than the locked region (this is where the user's attention belongs).
   - Both regions have JS/JSX syntax highlighting (CodeMirror 6).

**RIGHT column** (top-to-bottom):
1. **JSX challenge** — a code block titled "Render this", showing the JSX template the user's code will be tested against.
2. **Expected HTML** — a code block titled "Expected HTML output", showing the normalized expected DOM.
3. **Live preview** — a white card titled "Your code's actual output". When the user clicks Run, the rendered DOM appears here. Before any run, shows muted "no output yet" placeholder.
4. **Result banner** — appears below preview after a Run:
   - **Idle**: "Click **Run** to test your code."
   - **Pass** (green): "Pass — your code produces the expected output." Optional secondary action: "Next step →".
   - **Mismatch** (red): "Mismatch at `body > div#root > h1 > [text]`" with a small expected/actual diff snippet.
   - **Runtime error** (red): "Runtime error" + the JS error message in monospaced text.
   - **Compile error** (orange): "Could not parse your code" + the Babel error.
   - **Timeout** (red): "Execution timed out after 3s — likely an infinite loop."

**Action bar** (sticky bottom or top-right of LEFT column):
- `Run` (primary) — keyboard shortcut Cmd/Ctrl+Enter
- `Reset` — restores editor to starter code
- `Hint` — reveals the next progressive hint (steps may have 1–3)
- `Show solution` — danger-styled, requires confirm; does not unlock progression

### 3.2 Step navigation

- A persistent left rail or top breadcrumb listing all steps (`01 createElement · 02 render · 03 props · …`).
- States: completed (checkmark), current (highlighted), locked (muted, not clickable).
- A "furthest unlocked" pointer — the user can navigate back to completed steps freely, but can't skip forward past their progress.

### 3.3 Welcome / index screen

- Title + one-paragraph pitch.
- "Start" button → first step.
- "Resume" button if localStorage has progress.
- A vertical list of all steps with their titles, current progress, and pass/locked indicator.

### 3.4 Completion screen

- Shown after the final step passes.
- Recap: "You wrote ~310 lines that reproduce the un-React framework."
- Side-by-side: their accumulated code vs. the canonical [index.js](../index.js).
- CTA to view the source repo, share, or restart.

---

## 4. Constraints (non-negotiable)

- **Tech**: vanilla JS + Web Components (custom elements + open shadow DOM). No React, Vue, Tailwind. CSS lives in `src/styles.css` + per-component `<style>` blocks inside shadow roots.
- **Bundle**: keep it small. CodeMirror is the heaviest dep. No icon fonts; use inline SVG.
- **Themes**: dark theme is the default and only theme today. Design must work on dark backgrounds first.
- **Accessibility**: WCAG 2.1 AA. Code editor must keyboard-trap properly (Esc to exit, Tab indents). Result banners need ARIA live regions. Color cannot be the only signal for pass/fail (also need iconography or text label).
- **Responsive floor**: 1024px wide minimum. Mobile is out of scope (you can't reasonably write a fiber reconciler on a phone).
- **No marketing chrome**: no hero gradient, no testimonials, no "Trusted by" logos. The product is the curriculum, not a landing page.

---

## 5. What exists today (baseline you're improving on)

The MVP shipped with a functional but unstyled-by-a-designer dark UI. Current state of the step view:

- Left pane: title block on a `#0f0f10` card, concept paragraphs in white, editor with default CodeMirror "one-dark" theme.
- Right pane: two pre-styled code blocks (JSX challenge, expected HTML) on dark gray, then a white preview card, then a colored result banner (green/red/orange border + tinted background).
- Header: just `un-React` wordmark + tagline + step counter on the right.
- No left rail, no progress indicator, no completion screen.

Strengths to preserve:
- The 60/40 left-right split (editor side is wider).
- Dark surfaces with the white preview card creating a clear "this is where output happens" focal point.
- Color-coded result banners are immediately readable.

Weaknesses to fix:
- No visual hierarchy between concept text, code blocks, and the action area.
- Editor and locked-prev-code regions look identical — the boundary needs to be visually unmistakable.
- The action buttons (Run/Reset) currently sit directly above the editor with weak prominence; Run should be the loudest element on screen.
- No typography system (one font, one size for body text, no scale).
- No empty states designed for the preview pane beyond the placeholder text.
- No design for steps 5–8 which involve clicking simulated buttons inside the preview to verify event handling and state.

---

## 6. Deliverables

In priority order:

1. **Step view layout** — a high-fidelity mock of the main screen in its three key states (idle, pass, mismatch). Annotated with spacing, typography scale, and color tokens.
2. **Design tokens** — a small palette (background scales, accent for primary action, semantic colors for pass/fail/warn/info), a type scale (heading, body, code, caption), spacing scale (4px or 8px base).
3. **Editor treatment** — exact visual treatment of the locked region vs. the editable region, including the boundary marker.
4. **Result banner system** — a single component spec covering all five states (idle, pass, mismatch, runtime error, compile error, timeout) with a unified shape.
5. **Step navigation** — design and placement of the step list (rail vs. top breadcrumb — pick one and justify briefly).
6. **Welcome screen** — first impression, low-density.
7. **Completion screen** — a celebratory but restrained moment.
8. **Empty / error states** — preview pane "no output yet", network failure (rare but possible if Babel-standalone CDN fallback is used), step-not-found.

For each deliverable, include:
- A rendered mock (PNG or Figma frame).
- A short rationale (3–5 bullets) on the design choices.
- A handoff note — exact CSS values, font-family, font-weights, hex colors, sizes, and any animation specs.

---

## 7. Open design questions to answer in your proposal

1. **Locked-prev-code visualization** — gray background + lock icon? A diff-style left gutter? A collapsed "Show previous code" affordance? Which best supports the "continuous flow" narrative?
2. **Step navigation placement** — left rail (always visible, eats horizontal space) vs. top breadcrumb (compact, reveals on hover) vs. bottom progress bar (minimal, less explorable)?
3. **Action bar placement** — sticky top of editor, sticky bottom of viewport, or floating action button? Run must be reachable without scrolling.
4. **Typography for code vs. prose** — same monospace family throughout, or pair a serif/sans for prose with a mono for code? Pick a real font (or system stack) and justify.
5. **Pass-state celebration** — restrained label change, a subtle animation, or a more explicit "Next step →" handoff? Stay on-tone (no confetti).
6. **Steps 5–8 with interactive previews** — when a step requires the user to verify event handling (e.g., "click the button, verify the count goes up"), how do we surface that in the right pane? An auto-running test harness with a visible action log? A "your code is being tested with these clicks: [click], [click], [click]" affordance?

---

## 8. Reference inputs (read these before designing)

- Repo root: `/Users/avinashverma/Github/un-React/.claude/worktrees/peaceful-bose-1f865f`
- The framework being taught: [`index.js`](../index.js) (~310 LOC)
- The existing platform code (the thing you're redesigning): [`platform/src/`](./src/)
- The shipped MVP at runtime: `cd platform && npm install && npm run dev`
- Project plan with full architectural rationale: see the plan file
