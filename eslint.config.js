import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

// Старые скрипты удаляются в Task 16; до этого они не проверяются.
const LEGACY = [
  'data.js',
  'auth.js',
  'characters.js',
  'weapons.js',
  'artifacts.js',
  'regions.js',
  'guides.js',
  'patches.js',
  'banners.js',
  'index.js',
  'shared.js',
  'emailjs-config.js',
];

export default [
  {
    ignores: [
      'dist/',
      'node_modules/',
      'scripts/data/node_modules/',
      'src/data/generated/',
      '.superpowers/',
      ...LEGACY,
    ],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['scripts/**/*.{js,mjs}', 'build/**/*.js', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  prettier,
];
