// Shared types for the un-React platform.

export interface Step {
  id: string;
  title: string;
  explanation: string;
  prevCode: string;
  starterCode: string;
  solution: string;
  hostCode: string;
  jsxChallenge: string;
  expectedHtml: string;
  hints: string[];
  settleMs: number;
}

export type ConsoleKind = 'system' | 'info' | 'success' | 'error';
export interface ConsoleLine {
  kind: ConsoleKind;
  text: string;
}

export type RunResult =
  | { pass: true }
  | { pass: false; kind: 'compile'; error: string }
  | { pass: false; kind: 'runtime'; error: string }
  | { pass: false; kind: 'timeout'; error: string }
  | {
      pass: false;
      kind: 'mismatch';
      path: string;
      expected: string;
      actual: string;
    };

export type RunState =
  | { kind: 'idle' }
  | { kind: 'compiling' }
  | { kind: 'running' }
  | { kind: 'done'; result: RunResult };

export type NavId = 'curriculum' | 'editor' | 'reference' | 'community';
