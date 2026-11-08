---
name: release
description: Cut a new Nivasa release — version bump, release notes, checks, tag, push and deploy verification.
---

# Release

1. Decide the version (SemVer): fixes → PATCH, features → MINOR, breaking data changes → MAJOR.
2. Update `package.json` `version`.
3. Add the release at the TOP of `src/js/releases.js` (version, date, title, notes — plain language, flaws first if any).
4. Add the same release at the top of `CHANGELOG.md` under `## [x.y.z] — YYYY-MM-DD` with Added / Changed / Fixed / Deprecated sections.
5. Run: `npm run lint && npm test && npm run build && npx playwright test`. Fix failures before continuing.
6. Commit: `release: vX.Y.Z — <title>`; tag `git tag vX.Y.Z`; push with tags.
7. Confirm the “Deploy to GitHub Pages” workflow succeeded, then open the live site and check Settings → Version history.
8. Report briefly: what changed, test results, known limitations first.
