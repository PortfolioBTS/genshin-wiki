import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: { index: resolve(import.meta.dirname, 'index.html') },
    },
  },
  test: {
    include: ['tests/**/*.test.js'],
  },
});
