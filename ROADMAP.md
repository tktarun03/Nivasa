# Roadmap

## Next: v0.2.0 — Content and verification
- Confirm current editions of every standard marked “Requires professional verification” against the BIS standards portal; record section references where licensing allows.
- Replace illustrative budget rates with rates reviewed by practising contractors in at least three cities, with dates.
- Add licensed photography alongside illustrations (with explicit credits), starting with the featured designs.
- Real-device testing on an iPhone (Safari and Home Screen app) and a mid-range Android phone; fix what simulators miss.

## v0.3.0 — Languages
- Hindi and Tamil translations of the shell and page copy, reviewed by native speakers.
- Noto Sans Devanagari and Noto Sans Tamil loaded only for those locales.

## v0.4.0 — Deeper planning
- Room-by-room material picker that feeds the budget planner.
- Shareable read-only mood boards (export as image/PDF, then optional link sharing).
- Compare two designs side by side.

## v0.5.0 — Polish and performance
- Split GSAP and Fuse.js out of the shared bundle so lighter pages load less JavaScript.
- Lighthouse and axe audits in CI with budgets.
- Optional “What's new” sheet with screenshots.

## v1.0.0 — Stable public release
- After 3–5 real users have used it for a few weeks and the verification work above is complete.

---

## Decisions log

| Date | Decision | Why |
| --- | --- | --- |
| 2026-11-08 | Vite multi-page app, vanilla ES modules, no framework | Brief asked for modular HTML and minimal payloads; Vite gives a real build and dev server without a framework. |
| 2026-11-08 | Original generated SVG illustrations instead of stock photos | No licensing risk, no broken external URLs, honest labelling; photos can be added later with credits. |
| 2026-11-08 | Relative build base (`./`) | One build works at a domain root, a GitHub Pages subpath and in previews. |
| 2026-11-08 | Standards stored as document references with review status, not clause text | Avoids reproducing licensed BIS text and avoids inventing numbers; makes uncertainty visible. |
| 2026-11-08 | Recorded SP 7:2026 (National Building Construction Standards 2026) as current and SP 7:2016 as superseded | Secondary sources report NBC 2016 was withdrawn on 30 April 2026; the official BIS page still needs to be checked. |
| 2026-11-08 | Default brand name “Nivasa”, configurable in Settings | Matches the GitHub repository name; the brief asked for a configurable brand. |
| 2026-11-08 | BasKar patterns reused: bottom notices with Undo, refresh, version history, self-check, backup/restore, get-started checklist | Proven in the user's BasKar app. |
| 2026-11-08 | Swiper upgraded to v14 | v11 had a critical advisory in `npm audit`. |
