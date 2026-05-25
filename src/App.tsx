import { useCallback, useRef, useState } from 'react';
import steps from './steps';
import type { ConsoleLine } from './types';
import { TopBar } from './components/TopBar';
import { SideNav } from './components/SideNav';
import { StepView, type StepViewApi } from './components/StepView';

export default function App() {
  const [stepIndex] = useState(0); // multi-step nav comes when curriculum has > 1 step
  const apiRef = useRef<StepViewApi | null>(null);

  const step = steps[stepIndex];
  if (!step) {
    return (
      <div className="h-screen flex items-center justify-center text-on-surface-variant">
        No steps available.
      </div>
    );
  }

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

  const onSettings = useCallback(() => {
    setConsole([
      { kind: 'system', text: '[settings] no configurable options yet.' },
      { kind: 'info', text: '  future: theme toggle, font size, autorun on save.' },
    ]);
  }, [setConsole]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-on-background">
      <TopBar
        step={stepIndex + 1}
        total={steps.length}
        onHelp={onHelp}
        onSettings={onSettings}
      />
      <div className="flex flex-1 overflow-hidden">
        <SideNav />
        <main className="flex-1 flex overflow-hidden min-w-0">
          <StepView
            step={step}
            exposeApi={(api) => {
              apiRef.current = api;
            }}
          />
        </main>
      </div>
    </div>
  );
}
