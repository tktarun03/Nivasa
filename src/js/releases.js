/**
 * In-app release history (newest first). The top entry must match
 * package.json "version" and the top entry of CHANGELOG.md — a unit test checks.
 */
export const RELEASES = [
  {
    version: '0.1.0',
    date: '2026-11-08',
    title: 'Foundation',
    notes: [
      'Thirteen pages: home, explore, categories, category, design, collections, mood boards, budget, materials, standards, styles, settings and an interaction-pattern showcase.',
      'Full Indian interiors taxonomy with 66 demonstration designs, each illustrated with original artwork.',
      'Instant search and filters by room, style, city, climate, budget, property type and material.',
      'Favourites and mood boards saved on this device, with photo lock, reordering and undo.',
      'Indicative budget planner in rupees with stated assumptions.',
      'Materials library and a standards guide that marks what is confirmed and what needs professional verification.',
      'Onboarding, light and dark themes, text size, offline support and backup files.',
    ],
  },
];

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : RELEASES[0].version;
