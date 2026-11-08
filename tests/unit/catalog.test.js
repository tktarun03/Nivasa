import { describe, it, expect } from 'vitest';
import { filterDesigns, sortDesigns, paginate, matchesRule, relatedDesigns, filtersFromParams, countActiveFilters } from '../../src/js/services/catalog.js';
import data from '../../src/data/designs.json';

const designs = data.designs;

describe('catalogue search and filters', () => {
  it('returns everything with no filters', () => {
    expect(filterDesigns(designs, {})).toHaveLength(designs.length);
  });

  it('finds kitchens by search, including fuzzy matches', () => {
    const r = filterDesigns(designs, { q: 'kitchen' });
    expect(r.length).toBeGreaterThan(2);
    expect(r.every((d) => /kitchen|utility|chai|cooking/i.test(d.title + d.category + d.summary))).toBe(true);
    expect(filterDesigns(designs, { q: 'kitchn' }).length).toBeGreaterThan(0);
  });

  it('combines filters with AND across fields and OR within a field', () => {
    const r = filterDesigns(designs, { city: ['mumbai', 'chennai'], budget: ['premium'] });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((d) => ['mumbai', 'chennai'].includes(d.city) && d.budgetTier === 'premium')).toBe(true);
  });

  it('filters by scope', () => {
    const c = filterDesigns(designs, { scope: 'commercial' });
    expect(c.length).toBeGreaterThanOrEqual(11);
    expect(c.some((d) => d.category === 'living-room')).toBe(false);
  });

  it('filters by material and element arrays', () => {
    const r = filterDesigns(designs, { material: ['athangudi-tiles'] });
    expect(r.every((d) => d.materials.includes('athangudi-tiles'))).toBe(true);
    expect(filterDesigns(designs, { element: ['smart-home'] }).length).toBeGreaterThan(0);
  });

  it('sorts by budget and title', () => {
    const asc = sortDesigns(designs, 'budget-asc');
    expect(asc[0].budget.low).toBeLessThanOrEqual(asc[asc.length - 1].budget.low);
    const t = sortDesigns(designs, 'title');
    expect(t[0].title.localeCompare(t[1].title)).toBeLessThanOrEqual(0);
  });

  it('paginates with a clear end', () => {
    const p0 = paginate(designs, 0, 12);
    expect(p0.items).toHaveLength(12);
    expect(p0.hasMore).toBe(true);
    const last = Math.floor((designs.length - 1) / 12);
    expect(paginate(designs, last, 12).hasMore).toBe(false);
  });

  it('applies collection rules and related designs', () => {
    expect(designs.filter((d) => matchesRule(d, { scope: ['commercial'] })).length).toBeGreaterThan(0);
    const rel = relatedDesigns(designs, designs[0], 5);
    expect(rel).toHaveLength(5);
    expect(rel.some((d) => d.id === designs[0].id)).toBe(false);
  });

  it('reads filters from a URL (deep links)', () => {
    const f = filtersFromParams(new URLSearchParams('q=pooja&style=chettinad,kerala&sort=newest'));
    expect(f.q).toBe('pooja');
    expect(f.style).toEqual(['chettinad', 'kerala']);
    expect(f.sort).toBe('newest');
    expect(countActiveFilters(f)).toBe(2);
  });
});
