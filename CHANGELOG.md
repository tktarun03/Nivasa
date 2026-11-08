# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-11-08

First public foundation release.

### Added
- Thirteen real pages sharing one shell: Home, Explore, Categories, Category, Design, Collections, Mood boards, Budget planner, Materials, Standards, Styles, Settings and an Interaction-pattern showcase.
- Warm, minimalist design system: tokens for colour, type, spacing, radius, shadow, motion and breakpoints; light and dark themes; adjustable text size; reduced-motion support.
- Indian interiors taxonomy: 28 rooms, 23 interior elements, 12 property types, 11 commercial spaces and 16 styles.
- 66 demonstration designs with 198 original generated illustrations (no photographs, clearly labelled).
- Instant search (Fuse.js) and filters for room, element, style, city, climate, budget, property type and material; sorting; deep-linkable URLs; infinite scroll with an end state; refresh button and pull to refresh.
- Design page with Swiper gallery, PhotoSwipe full-screen viewer (pinch-zoom, swipe-down to close), photo lock, favourite, save to board and share.
- Favourites with optimistic saving and rollback; mood boards with create, rename, delete, drag-to-reorder, move buttons, photo/cover lock and undo.
- Indicative budget planner in rupees (Indian digit grouping, lakh/crore), four-step flow, assumptions, inclusions and exclusions.
- Materials library with alphabetical index and side-by-side comparison of up to three materials.
- Standards guide separating statutory, model-code, industry and cultural (Vastu) guidance, with a review status and sources for every entry.
- Onboarding tour with optional preferences, replayable from Settings; get-started checklist on Home.
- BasKar-style bottom notices with Undo, HUD confirmations, live save status, optional haptics.
- Offline support (service worker), web manifest and icons; backup and restore files; self-check in Settings; version history.
- Unit tests (Vitest), browser smoke tests (Playwright) and GitHub Actions for CI and GitHub Pages deployment.

### Known limitations
- Hindi and Tamil are prepared but not translated.
- Standards entries are identified from official and secondary sources; most still need confirmation of the current edition (see the Standards page).
- Budget rates are an illustrative model, not market quotations.
