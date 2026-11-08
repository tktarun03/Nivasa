/** Every page is a real entry with the shared shell wiring and no placeholder text. */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const pages = readdirSync(new URL('pages/', root));

describe('page structure', () => {
  it('has the 12 sub-pages plus home', () => {
    expect(pages.sort()).toEqual(['budget', 'categories', 'category', 'collections', 'design', 'explore', 'materials', 'moodboards', 'patterns', 'settings', 'standards', 'styles']);
  });

  it.each(['index.html', ...pages.map((p) => `pages/${p}/index.html`)])('%s is wired to a page module', (file) => {
    const html = readFileSync(new URL(file, root), 'utf8');
    expect(html).toMatch(/<main id="main"/);
    expect(html).toMatch(/name="app-root"/);
    expect(html).toMatch(/name="viewport"[^>]+viewport-fit=cover/);
    const src = html.match(/src="\/(src\/js\/pages\/[\w-]+\.js)"/)?.[1];
    expect(src).toBeTruthy();
    expect(existsSync(new URL(src, root))).toBe(true);
    expect(html.toLowerCase()).not.toContain('lorem');
  });
});
