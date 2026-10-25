import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { partialsPlugin } from './build/partials-plugin.js';

// Все HTML-страницы сайта (файлы в корне проекта).
const PAGES = [
  'index',
  'characters',
  'character',
  'weapons',
  'artifacts',
  'regions',
  'guides',
  'patches',
  'banners',
  'auth',
];

export default defineConfig({
  base: './',
  plugins: [partialsPlugin({ dir: resolve(import.meta.dirname, 'partials') })],
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        PAGES.map((page) => [page, resolve(import.meta.dirname, `${page}.html`)]),
      ),
    },
  },
  test: {
    include: ['tests/**/*.test.js'],
  },
});
