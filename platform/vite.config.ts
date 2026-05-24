import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Repo is served at https://avi892nash.github.io/un-React/, so the production
// build needs assets under that base path. Dev keeps the default `/` so
// localhost links work without rewrites.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  root: '.',
  base: command === 'build' ? '/un-React/' : '/',
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
}));
