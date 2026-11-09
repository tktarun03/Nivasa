/**
 * Catalogue service: taxonomy look-ups, search, filtering, sorting and paging.
 * The pure functions (filterDesigns, sortDesigns, paginate) are unit tested.
 */
import Fuse from 'fuse.js';
import categoriesData from '../../data/categories.json';
import stylesData from '../../data/styles.json';

export const categories = categoriesData;
export const styles = stylesData.styles;
export const styleById = Object.fromEntries(styles.map((s) => [s.id, s]));
export const groups = categoriesData.groups;
export const cityById = Object.fromEntries(categoriesData.cities.map((c) => [c.id, c]));
export const climateById = Object.fromEntries(categoriesData.climates.map((c) => [c.id, c]));
export const tierById = Object.fromEntries(categoriesData.budgetTiers.map((t) => [t.id, t]));

const itemIndex = {};
for (const g of groups) for (const it of g.items) itemIndex[it.id] = { ...it, group: g.id, scope: g.scope };
export const termById = itemIndex;
export const nameOf = (id) => itemIndex[id]?.name ?? cityById[id]?.name ?? climateById[id]?.name ?? tierById[id]?.name ?? id;
export const groupOf = (id) => itemIndex[id]?.group;
export const scopeOfCategory = (id) => (itemIndex[id]?.group === 'commercial' ? 'commercial' : 'residential');

export const SORTS = [
  { id: 'relevance', name: 'Best match' },
  { id: 'newest', name: 'Newest' },
  { id: 'popular', name: 'Most saved' },
  { id: 'budget-asc', name: 'Budget: low to high' },
  { id: 'budget-desc', name: 'Budget: high to low' },
  { id: 'title', name: 'A to Z' },
];

export const FILTER_KEYS = ['category', 'element', 'style', 'city', 'climate', 'budget', 'property', 'material'];

let cache = null;
let materialsCache = null;

/** Load the design catalogue (a separate chunk, so pages can show skeletons). */
export async function loadDesigns() {
  if (cache) return cache;
  const mod = await import('../../data/designs.json');
  cache = mod.default.designs;
  return cache;
}
export async function loadMaterials() {
  if (materialsCache) return materialsCache;
  const mod = await import('../../data/materials.json');
  materialsCache = mod.default;
  return materialsCache;
}
export function resetCache() {
  cache = null;
  fuse = null;
}

let fuse = null;
const MAX_SCORE = 0.65;
function searchDocs(designs) {
  return designs.map((d) => ({
    id: d.id,
    title: d.title,
    summary: d.summary,
    category: nameOf(d.category),
    keywords: (itemIndex[d.category]?.keywords || []).join(' '),
    style: styleById[d.style]?.name || d.style,
    city: cityById[d.city]?.name || d.city,
    elements: d.elements.map(nameOf).join(' '),
    materials: d.materials.join(' ').replace(/-/g, ' '),
  }));
}
export function searchIds(designs, q) {
  if (!q || !q.trim()) return null;
  if (!fuse || fuse._docs?.length !== designs.length) {
    fuse = new Fuse(searchDocs(designs), {
      keys: [
        { name: 'title', weight: 3 },
        { name: 'category', weight: 2 },
        { name: 'keywords', weight: 1.5 },
        { name: 'style', weight: 2 },
        { name: 'city', weight: 1.5 },
        { name: 'elements', weight: 1 },
        { name: 'materials', weight: 1 },
        { name: 'summary', weight: 0.6 },
      ],
      threshold: 0.36,
      ignoreLocation: true,
      includeScore: true,
    });
  }
  // Fuse combines weak matches across many fields; drop the noisy tail.
  return fuse
    .search(q.trim())
    .filter((r) => r.score <= MAX_SCORE)
    .map((r) => ({ id: r.item.id, score: r.score }));
}

/** filters: { q, scope, category:[], element:[], style:[], city:[], climate:[], budget:[], property:[], material:[] } */
export function filterDesigns(designs, filters = {}) {
  const has = (arr) => Array.isArray(arr) && arr.length > 0;
  const hits = searchIds(designs, filters.q);
  const scoreById = hits ? new Map(hits.map((h) => [h.id, h.score])) : null;
  return designs
    .filter((d) => {
      if (scoreById && !scoreById.has(d.id)) return false;
      if (filters.scope && filters.scope !== 'all') {
        if (filters.scope === 'commercial' && scopeOfCategory(d.category) !== 'commercial') return false;
        if (filters.scope === 'residential' && scopeOfCategory(d.category) !== 'residential') return false;
        if (filters.scope === 'regional' && styleById[d.style]?.kind !== 'regional') return false;
      }
      if (has(filters.category) && !filters.category.includes(d.category)) return false;
      if (has(filters.element) && !d.elements.some((e) => filters.element.includes(e))) return false;
      if (has(filters.style) && !filters.style.includes(d.style)) return false;
      if (has(filters.city) && !filters.city.includes(d.city)) return false;
      if (has(filters.climate) && !filters.climate.includes(d.climate)) return false;
      if (has(filters.budget) && !filters.budget.includes(d.budgetTier)) return false;
      if (has(filters.property) && !filters.property.includes(d.property)) return false;
      if (has(filters.material) && !d.materials.some((m) => filters.material.includes(m))) return false;
      return true;
    })
    .map((d) => (scoreById ? { ...d, _score: scoreById.get(d.id) } : d));
}

export function sortDesigns(list, sort = 'relevance') {
  const arr = [...list];
  switch (sort) {
    case 'newest':
      return arr.sort((a, b) => b.added.localeCompare(a.added) || a.title.localeCompare(b.title));
    case 'popular':
      return arr.sort((a, b) => b.popularity - a.popularity);
    case 'budget-asc':
      return arr.sort((a, b) => a.budget.low - b.budget.low);
    case 'budget-desc':
      return arr.sort((a, b) => b.budget.high - a.budget.high);
    case 'title':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    default:
      // relevance: search score when searching, otherwise featured first then popularity
      return arr.sort((a, b) =>
        a._score !== undefined && b._score !== undefined
          ? a._score - b._score
          : Number(b.featured) - Number(a.featured) || b.popularity - a.popularity,
      );
  }
}

export function paginate(list, page, pageSize = 12) {
  const start = page * pageSize;
  const items = list.slice(start, start + pageSize);
  return { items, page, pageSize, total: list.length, hasMore: start + pageSize < list.length };
}

export function countActiveFilters(filters) {
  return FILTER_KEYS.reduce((n, k) => n + (filters[k]?.length || 0), 0);
}

/** Apply a collection rule ({ field: [values] }) */
export function matchesRule(d, rule) {
  return Object.entries(rule).every(([field, values]) => {
    if (field === 'scope') return values.includes(scopeOfCategory(d.category));
    const v = d[field];
    return Array.isArray(v) ? v.some((x) => values.includes(x)) : values.includes(v);
  });
}

export function relatedDesigns(designs, design, n = 6) {
  return designs
    .filter((d) => d.id !== design.id)
    .map((d) => ({
      d,
      score:
        (d.category === design.category ? 3 : 0) +
        (d.style === design.style ? 2 : 0) +
        (d.city === design.city ? 1 : 0) +
        d.materials.filter((m) => design.materials.includes(m)).length * 0.5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.d);
}

export function filtersFromParams(sp) {
  const f = { q: sp.get('q') || '', scope: sp.get('scope') || 'all', sort: sp.get('sort') || 'relevance' };
  FILTER_KEYS.forEach((k) => (f[k] = (sp.get(k) || '').split(',').filter(Boolean)));
  return f;
}
