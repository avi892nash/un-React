// Iframe sandbox runner. Posts the transpiled bundle into a sandboxed iframe
// via srcdoc, waits for it to message back with rendered #root.innerHTML or
// an error, and tears it down. Has a 3s watchdog for infinite-loop user code.

export interface RunOutput {
  ok: boolean;
  html: string;
  error: string | null;
}

const WATCHDOG_MS = 3000;

function buildSrcdoc(bundle: string, settleMs: number): string {
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
  window.addEventListener('error', function (e) {
    snap((e.error && e.error.message) || e.message || 'unknown error');
  });
  try {
    ${safe}
    setTimeout(function () { snap(null); }, ${settleMs});
  } catch (e) {
    snap(e && e.message ? e.message : String(e));
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
      if (!data || data.type !== 'unreact:done') return;
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
