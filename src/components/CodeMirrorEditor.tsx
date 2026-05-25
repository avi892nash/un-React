import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { customSyntaxHighlighting } from '../lib/syntax';

interface Props {
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  className?: string;
}

/**
 * Thin React wrapper around CodeMirror 6. The editor is a true uncontrolled
 * widget — we only sync `value` IN when the prop diverges from the doc state
 * (e.g. parent calls reset), never on every render.
 */
export function CodeMirrorEditor({ value, onChange, readOnly = false, className }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep latest onChange in a ref so the editor's update listener doesn't
  // depend on it (avoids rebuilding the editor on every parent re-render).
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Build the editor once (when readOnly or initial value changes meaningfully).
  useEffect(() => {
    if (!hostRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          javascript({ jsx: true }),
          customSyntaxHighlighting,
          ...(readOnly
            ? [EditorState.readOnly.of(true), EditorView.editable.of(false)]
            : []),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) {
              onChangeRef.current?.(u.state.doc.toString());
            }
          }),
        ],
      }),
      parent: hostRef.current,
    });
    viewRef.current = view;
    // Attach the EditorView to its DOM root for downstream test/automation access.
    // Public API is `EditorView.findFromDOM(node)`, but a direct property is cheaper.
    (view.dom as HTMLElement & { _view?: EditorView })._view = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  // External `value` sync — replace doc when parent value diverges from doc.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return <div ref={hostRef} className={className} />;
}
