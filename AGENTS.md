# AGENTS.md — working on Nivasa

Nivasa is a mobile-first, India-centric interior design web app. Static multi-page site built with Vite and vanilla ES modules; all user data lives in the browser.

## Where things are

| You want to… | Look in |
| --- | --- |
| Change colours, type, spacing, motion | `src/styles/tokens.css` (never hard-code values in components) |
| Change the header, bottom nav, footer, page links | `src/js/navigation.js` |
| Change what every page does on boot | `src/js/app.js` |
| Edit one page | `pages/<name>/index.html` (structure) + `src/js/pages/<name>.js` (behaviour) |
| Add or edit designs | `scripts/seed-catalogue.mjs`, then `node scripts/seed-catalogue.mjs && npm run art` |
| Edit categories, cities, climates | `src/data/categories.json` |
| Edit materials / styles / standards | `src/data/materials.json`, `styles.json`, `standards.json` |
| Change budget rates or assumptions | `src/js/services/budgetModel.js` (update `MODEL_REVIEWED`) |
| Saved data shape | `src/js/storage/store.js` (`defaults()` and `migrate()`) |
| Toasts | `src/js/components/toast.js` — BasKar pattern, one at a time |
| UI strings | `src/i18n/en.json`; use `t('key', { vars })` |

## Golden rules

1. **Never invent technical facts.** No made-up standard numbers, dimensions, clearances or fire ratings. New standards entries need a source, an edition and a `reviewStatus`; if you can't confirm it, use `verify`.
2. **Demo content stays labelled.** Designs are `demo: true` and their images are illustrations; never describe them as real projects or photos.
3. **Every saved field gets a default in `migrate()`**; never rename or remove a field without a migration.
4. **Escape all user or external text** before it goes into HTML (`esc()` or the `html` tag in `utilities/dom.js`).
5. **Every gesture has a button alternative**; every animation respects reduced motion.
6. **Every action that changes saved data shows a toast**; offer Undo when it can be safely reversed, and re-check current state inside the Undo.
7. **No control without a real action.** No placeholder pages, no lorem ipsum.
8. Inputs are 16px or larger, tap targets 44px or larger; no text below 11px.

## Test and release

```bash
npm run lint && npm test && npm run build && npx playwright test
```

Release checklist (see `.claude/skills/release/SKILL.md`): bump `package.json` version → add the entry at the top of `src/js/releases.js` and `CHANGELOG.md` (a unit test checks all three match) → run all checks → commit → tag `vX.Y.Z` → push → confirm the Pages deploy succeeded.

## Sharp edges

- `npm run build` regenerates illustrations from data; commit the regenerated SVGs.
- Links must stay relative (use `href()` / `asset()` from `navigation.js`), or the GitHub Pages subpath breaks.
- The service worker caches by version; bump the version to invalidate.
- Pull-to-refresh sets `overscroll-behavior-y: contain` on pages that use it.
- `scripts/generate-icons.mjs` needs `sharp`, which is not a project dependency.
