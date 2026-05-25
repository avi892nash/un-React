// unreact-platform — production static server.
//
// Serves the Vite `dist/` build over HTTP with an SPA fallback (any path
// without a file extension serves index.html so client-side routes work).
// Zero npm dependencies; only Node built-ins. Runs under systemd in
// production via packaging/systemd/unreact-platform.service.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT ?? 28291);
const HOSTNAME = process.env.HOSTNAME ?? '0.0.0.0';

// In dev: __dirname is `platform/`, ROOT is `platform/dist/`.
// In production (.deb): __dirname is `/opt/unreact-platform/`, ROOT is `/opt/unreact-platform/dist/`.
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, 'dist');

const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript; charset=utf-8',
  '.mjs':   'application/javascript; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.json':  'application/json; charset=utf-8',
  '.svg':   'image/svg+xml',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.gif':   'image/gif',
  '.ico':   'image/x-icon',
  '.webp':  'image/webp',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.txt':   'text/plain; charset=utf-8',
  '.xml':   'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

const server = createServer(async (req, res) => {
  // Health endpoint for systemd / smoke tests
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok\n');
    return;
  }

  try {
    const pathname = decodeURIComponent(
      new URL(req.url ?? '/', `http://${req.headers.host}`).pathname,
    );

    // SPA fallback: paths without a file extension serve index.html
    const ext = extname(pathname).toLowerCase();
    const target = ext ? join(ROOT, pathname) : join(ROOT, 'index.html');

    // Prevent path traversal
    if (!target.startsWith(ROOT + '/') && target !== ROOT) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden\n');
      return;
    }

    const body = await readFile(target);
    const mime = MIME[extname(target).toLowerCase()] ?? 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      // index.html must never be cached so deploys take effect immediately.
      // Everything else has a content-hash in the filename → cache forever.
      'Cache-Control': target.endsWith('index.html')
        ? 'no-cache'
        : 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(body);
  } catch (err) {
    if ((err)?.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found\n');
      return;
    }
    console.error('[unreact-platform] server error:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal error\n');
  }
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`[unreact-platform] listening on http://${HOSTNAME}:${PORT}/`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log(`[unreact-platform] ${sig} received, shutting down`);
    server.close(() => process.exit(0));
    // Hard exit after 15s if connections don't drain
    setTimeout(() => process.exit(1), 15000).unref();
  });
}
