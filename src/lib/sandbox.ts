// Iframe sandbox runner. Posts the transpiled bundle into a sandboxed iframe
// via srcdoc, waits for it to message back with rendered #root.innerHTML or
// an error, and tears it down. Has a 3s watchdog for infinite-loop user code.
//
// Edge cases this handles explicitly:
//   - Synchronous throw          → caught, surfaced as runtime error.
//   - Async throw / unhandled    → window.error + unhandledrejection listeners.
//   - Infinite loop              → watchdog kills it at WATCHDOG_MS.
//   - Code that never renders    → settleMs elapses, snap with whatever's in #root
//                                  (the diff will then catch "no output").
//   - User code shadowing globals → still works; we don't depend on user-defined names.

export interface RunOutput {
  ok: boolean;
  html: string;
  error: string | null;
}

const WATCHDOG_MS = 3000;

function buildSrcdoc(bundle: string, settleMs: number): string {
  // </script can prematurely close our wrapper. Escape it.
  const safe = bundle.replace(/<\/script/gi, '<\\/script');
  return `<!DOCTYPE html>
<html>
<body>
<div id="root"></div>
<script>
(function () {
  var snapped = false;
  function snap(error) {
    if (snapped) return;
    snapped = true;
    var html = '';
    try { html = document.getElementById('root').innerHTML; } catch (_) {}
    parent.postMessage({
      type: 'unreact:done',
      ok: !error,
      error: error || null,
      html: html
    }, '*');
  }
  // Catch synchronous errors that escape the try below (e.g. setTimeout callbacks).
  window.addEventListener('error', function (e) {
    var msg = (e.error && e.error.message) || e.message || 'unknown error';
    snap(formatError(msg));
  });
  // Catch unhandled promise rejections too (rare in user code but possible).
  window.addEventListener('unhandledrejection', function (e) {
    var reason = e.reason;
    var msg = (reason && reason.message) ? reason.message : String(reason || 'unhandled rejection');
    snap(formatError(msg));
  });
  // Make common gotchas more legible. The user is just learning the framework;
  // ReferenceError on a function they were supposed to define is THE classic.
  function formatError(msg) {
    if (/is not defined/.test(msg) || /is not a function/.test(msg)) {
      return msg + '  (tip: did you implement every function the step asks for?)';
    }
    if (/Maximum call stack/.test(msg)) {
      return msg + '  (tip: a recursive call without a base case?)';
    }
    return msg;
  }
  try {
    ${safe}
    setTimeout(function () { snap(null); }, ${settleMs});
  } catch (e) {
    snap(formatError(e && e.message ? e.message : String(e)));
  }
})();
</script>
</body>
</html>`;
}

export function run(bundle: string, settleMs = 0): Promise<RunOutput> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox.value = 'allow-scripts';
    iframe.srcdoc = buildSrcdoc(bundle, settleMs);

    let done = false;
    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      try {
        iframe.src = 'about:blank';
      } catch {
        /* noop */
      }
      iframe.remove();
    };

    const onMessage = (e: MessageEvent) => {
      const data = e.data as
        | { type?: string; ok?: boolean; html?: string; error?: string | null }
        | undefined;
      if (!data) return;
      // Only react to the 'done' signal here — the VDOM tree message (from
      // StepView) flows past this listener.
      if (data.type !== 'unreact:done') return;
      if (e.source !== iframe.contentWindow) return;
      if (done) return;
      done = true;
      clearTimeout(watchdog);
      cleanup();
      resolve({
        ok: !!data.ok,
        html: data.html ?? '',
        error: data.error ?? null,
      });
    };

    const watchdog = window.setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      resolve({
        ok: false,
        html: '',
        error: `execution timed out after ${WATCHDOG_MS}ms (infinite loop?)`,
      });
    }, WATCHDOG_MS);

    window.addEventListener('message', onMessage);
    document.body.appendChild(iframe);
  });
}
