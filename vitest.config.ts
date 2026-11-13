import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    // Variables defined before any file is loaded (the config is validated at import time).
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'a-test-secret-with-at-least-32-characters',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/**/*.module.ts', 'src/users/pg-users.repository.ts'],
      thresholds: { lines: 80, branches: 75, functions: 80 },
    },
  },
});