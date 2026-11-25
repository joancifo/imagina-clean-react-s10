/// <reference types="vitest" />
import { configDefaults } from 'vitest/config';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Sesión 9 · BFF_URL deja que los E2E apunten a su propio BFF (server/e2e.mjs, puerto 3101).
  // `vite preview` hereda este proxy (preview.proxy usa server.proxy por defecto).
  server: { port: 5173, proxy: { '/api': process.env.BFF_URL ?? 'http://localhost:3001' } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    // Sesión 9 · Los E2E los ejecuta Playwright, no Vitest: mismos nombres (*.spec.ts), otro runner.
    exclude: [...configDefaults.exclude, 'e2e/**', 'examples/tema20/**'],
    coverage: { reporter: ['text-summary', 'text'], include: ['src/**'], exclude: ['src/main.tsx', 'src/setupTests.ts', 'src/**/*.test.*'] },
  },
});
