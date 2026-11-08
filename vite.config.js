import { defineConfig } from 'vite';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const root = new URL('.', import.meta.url).pathname;

// Every folder in /pages with an index.html becomes its own entry page.
const pageInputs = Object.fromEntries(
  readdirSync(resolve(root, 'pages'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(resolve(root, 'pages', d.name, 'index.html')))
    .map((d) => [d.name, resolve(root, 'pages', d.name, 'index.html')]),
);

export default defineConfig({
  // Relative base: the same build works at a domain root, under a GitHub Pages
  // repository subpath (/india-interior-studio/) and in a hosted preview.
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      input: { home: resolve(root, 'index.html'), ...pageInputs },
    },
  },
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
  },
});
