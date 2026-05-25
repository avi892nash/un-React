// The "end page" — shown in the main pane after every implemented step has
// passed at least once. Three responsibilities:
//   1. Capture the candidate name (saved to platformState for next time).
//   2. Show the score breakdown (per step + overall percent).
//   3. Offer the two downloads — PDF certificate, framework .js code.
//
// Visible in the sidebar as "Certificate" once allPassed flips to true.

import { useCallback } from 'react';
import type { Step } from '../types';
import type { PlatformState } from '../lib/storage';
import { computeScore } from '../lib/scoring';
import { downloadCertificate } from '../lib/certificate';
import { buildFrameworkCode, downloadText } from '../lib/framework-code';

const VERSION_TAG = 'v0.4.2-beta';

interface Props {
  steps: Step[];
  platformState: PlatformState;
  onStateChange: (next: PlatformState) => void;
  onBack: () => void;
}

export function CompletionView({ steps, platformState, onStateChange, onBack }: Props) {
  const stepIds = steps.map((s) => s.id);
  const score = computeScore(platformState, stepIds);

  const setName = useCallback(
    (next: string) => onStateChange({ ...platformState, candidateName: next }),
    [platformState, onStateChange],
  );

  const onDownloadCertificate = useCallback(() => {
    // jspdf is dynamically imported; surface any chunk-load error in the
    // console rather than letting it silently fail.
    downloadCertificate({
      candidateName: platformState.candidateName,
      score,
      versionTag: VERSION_TAG,
    }).catch((err: unknown) => {
      console.error('[un-react] certificate generation failed:', err);
    });
  }, [platformState.candidateName, score]);

  const onDownloadCode = useCallback(() => {
    const code = buildFrameworkCode(steps);
    downloadText('un-react.js', code);
  }, [steps]);

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="max-w-3xl mx-auto px-margin-desktop py-12 space-y-10 animate-rise-in">
        <header className="space-y-2 text-center">
          <span className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase font-bold">
            Course complete
          </span>
          <h1 className="font-headline-xl text-headline-xl text-on-surface">
            You built a React-like framework.
          </h1>
          <p className="text-on-surface-variant text-body-lg">
            {score.passedCount} of {score.totalSteps} step{score.totalSteps === 1 ? '' : 's'} passed
            {' · '}final score <span className="text-tertiary font-bold">{score.percent}%</span>
          </p>
        </header>

        <section className="bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-4">
          <h2 className="font-headline-md text-headline-md text-on-surface">Your name on the certificate</h2>
          <input
            type="text"
            value={platformState.candidateName}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Avinash Verma"
            className="w-full bg-surface-container px-4 py-3 rounded-lg border border-outline-variant text-on-surface text-body-lg placeholder:text-on-surface-variant focus:outline-none focus:border-tertiary"
            aria-label="Candidate name for certificate"
          />
          <p className="text-on-surface-variant text-body-md opacity-80">
            Saved locally — used on the PDF certificate. Leave blank to default to "Developer".
          </p>
        </section>

        <section className="bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-4">
          <h2 className="font-headline-md text-headline-md text-on-surface">Score breakdown</h2>
          <table className="w-full text-body-md">
            <thead>
              <tr className="text-on-surface-variant text-label-sm uppercase tracking-wider">
                <th className="text-left py-2 font-normal">Step</th>
                <th className="text-right py-2 font-normal">Score</th>
              </tr>
            </thead>
            <tbody>
              {score.perStep.map((s) => (
                <tr key={s.id} className="border-t border-outline-variant">
                  <td className="py-2 text-on-surface font-code-block text-code-inline">{s.id}</td>
                  <td className="py-2 text-right text-on-surface font-bold">
                    {s.passed ? `${s.score} / 100` : <span className="text-on-surface-variant opacity-70">—</span>}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-outline-variant">
                <td className="py-2 text-on-surface font-bold">Total</td>
                <td className="py-2 text-right text-tertiary font-bold">{score.total} / {score.totalSteps * 100}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-on-surface-variant text-body-md opacity-80">
            100 base · −10 per hint revealed · −5 per attempt beyond the first.
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onDownloadCertificate}
            className="bg-tertiary text-on-tertiary px-6 py-5 rounded-xl font-bold flex flex-col items-start gap-1 hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">workspace_premium</span>
              Download certificate
            </span>
            <span className="text-body-md opacity-90 font-normal text-left">
              PDF · A4 landscape · includes your name + score + a unique serial.
            </span>
          </button>
          <button
            type="button"
            onClick={onDownloadCode}
            className="bg-surface-container border border-outline-variant text-on-surface px-6 py-5 rounded-xl font-bold flex flex-col items-start gap-1 hover:bg-surface-container-high hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">download</span>
              Download framework code
            </span>
            <span className="text-body-md text-on-surface-variant opacity-90 font-normal text-left">
              un-react.js · the canonical reference implementation, in step order.
            </span>
          </button>
        </section>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-on-surface-variant hover:text-on-surface text-body-md cursor-pointer inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
            back to curriculum
          </button>
        </div>
      </div>
    </div>
  );
}
