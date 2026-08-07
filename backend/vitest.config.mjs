import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The backend is CommonJS, and Vitest's own API cannot be `require`d.
    // Exposing describe/it/expect as globals lets the tests stay in the
    // project's module system instead of forcing ESM on one directory.
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
