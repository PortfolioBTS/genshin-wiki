import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { partialsPlugin } from './build/partials-plugin.js';

// Страницы, уже перенесённые на Vite. Каждая задача переноса дописывает свою.
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
