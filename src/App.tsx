import { useCallback, useEffect, useRef, useState } from 'react';
import steps from './steps';
import type { ConsoleLine } from './types';
import {
  type PlatformState,
  loadState,
  saveState,
} from './lib/storage';
import { isAllPassed } from './lib/scoring';
import { TopBar } from './components/TopBar';
import { SideNav } from './components/SideNav';
import { StepView, type StepViewApi } from './components/StepView';
import { CompletionView } from './components/CompletionView';
import { SettingsDialog } from './components/SettingsDialog';

type View = 'curriculum' | 'completion';

export default function App() {
  // Single source of truth for everything persisted (per-step attempts /
  // hints / passed, candidate name, VDOM toggle). Loaded once from
  // localStorage; saved on every change. Children dispatch via setState.
  const [platformState, setPlatformState] = useState<PlatformState>(() => loadState());
  useEffect(() => { saveState(platformState); }, [platformState]);

  const [view, setView] = useState<View>('curriculum');
  const [showSettings, setShowSettings] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const apiRef = useRef<StepViewApi | null>(null);

  const step = steps[stepIndex];
  if (!step) {
    return (
      <div className="h-screen flex items-center justify-center text-on-surface-variant">
        No steps available.
      </div>
    );
  }

  const stepIds = steps.map((s) => s.id);
  const allPassed = isAllPassed(platformState, stepIds);

  // Auto-jump to completion the moment the user passes the last step. Only
  // fires once per session — once they've seen it they can navigate freely.
  const announcedCompletionRef = useRef(false);
  useEffect(() => {
    if (allPassed && !announcedCompletionRef.current) {
      announcedCompletionRef.current = true;
      setView('completion');
    }
  }, [allPassed]);

  const setConsole = useCallback((lines: ConsoleLine[]) => {
    apiRef.current?.setConsoleLines(lines);
  }, []);

  const onHelp = useCallback(() => {
    setConsole([
      { kind: 'system', text: '[help] keyboard shortcuts:' },
      { kind: 'info', text: '  ⌘/Ctrl + Enter   run your code' },
      { kind: 'info', text: '  hint button      reveal a progressive hint' },
      { kind: 'info', text: '  reset button     restore the starter scaffold' },
    ]);
  }, [setConsole]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-on-background">
      <TopBar
        step={stepIndex + 1}
        total={steps.length}
        onHelp={onHelp}
        onSettings={() => setShowSettings(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <SideNav
          steps={steps}
          currentStepId={step.id}
          allPassed={allPassed}
          activeView={view}
          onSelectStep={(id) => {
            const idx = steps.findIndex((s) => s.id === id);
            if (idx >= 0) {
              setStepIndex(idx);
              setView('curriculum');
            }
          }}
          onSelectCompletion={() => setView('completion')}
          onSelectCurriculum={() => setView('curriculum')}
        />
        <main className="flex-1 flex overflow-hidden min-w-0">
          {view === 'curriculum' ? (
            <StepView
              step={step}
              platformState={platformState}
              onStateChange={setPlatformState}
              exposeApi={(api) => { apiRef.current = api; }}
            />
          ) : (
            <CompletionView
              steps={steps}
              platformState={platformState}
              onStateChange={setPlatformState}
              onBack={() => setView('curriculum')}
            />
          )}
        </main>
      </div>
      {showSettings && (
        <SettingsDialog
          platformState={platformState}
          onStateChange={setPlatformState}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
