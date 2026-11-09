/**
 * Guards the content model: taxonomy coverage required by the brief, valid
 * references between files, honest standards metadata and version alignment.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import categories from '../../src/data/categories.json';
import { designs } from '../../src/data/designs.json';
import materialsData from '../../src/data/materials.json';
import standards from '../../src/data/standards.json';
import stylesData from '../../src/data/styles.json';
import collections from '../../src/data/collections.json';
import { RELEASES } from '../../src/js/releases.js';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url)));
const group = (id) => categories.groups.find((g) => g.id === id).items.map((i) => i.id);
const materialIds = new Set(materialsData.materials.map((m) => m.id));
const stdIds = new Set(standards.documents.map((d) => d.id));

describe('taxonomy coverage', () => {
  it('has every group from the brief', () => {
    expect(group('rooms')).toHaveLength(28);
    expect(group('elements')).toHaveLength(23);
    expect(group('property')).toHaveLength(12);
    expect(group('commercial')).toHaveLength(11);
    expect(group('styles')).toHaveLength(16);
  });

  it('has at least one design for every room and commercial category', () => {
    const used = new Set(designs.map((d) => d.category));
    [...group('rooms'), ...group('commercial')].forEach((c) => expect(used.has(c), c).toBe(true));
  });

  it('covers every element, property type and style in at least one design', () => {
    const els = new Set(designs.flatMap((d) => d.elements));
    group('elements').forEach((e) => expect(els.has(e), e).toBe(true));
    const props = new Set(designs.map((d) => d.property));
    group('property').forEach((p) => expect(props.has(p), p).toBe(true));
    const sts = new Set(designs.map((d) => d.style));
    group('styles').forEach((s) => expect(sts.has(s), s).toBe(true));
  });

  it('has unique ids across the taxonomy', () => {
    const all = categories.groups.filter((g) => g.id !== 'styles').flatMap((g) => g.items.map((i) => i.id));
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('design records', () => {
  it('reference valid taxonomy, materials and styles', () => {
    const styleIds = new Set(stylesData.styles.map((s) => s.id));
    const cities = new Set(categories.cities.map((c) => c.id));
    designs.forEach((d) => {
      expect(styleIds.has(d.style), d.id).toBe(true);
      expect(cities.has(d.city), d.id).toBe(true);
      d.materials.forEach((m) => expect(materialIds.has(m), `${d.id}:${m}`).toBe(true));
      d.elements.forEach((e) => expect(group('elements').includes(e), `${d.id}:${e}`).toBe(true));
    });
  });

  it('are labelled as demonstration data with alt text and licence', () => {
    designs.forEach((d) => {
      expect(d.demo).toBe(true);
      expect(d.license).toBeTruthy();
      d.images.forEach((img) => expect(img.alt.length).toBeGreaterThan(20));
    });
  });

  it('have generated image files', () => {
    const dir = new URL('../../public/assets/illustrations/designs/', import.meta.url);
    if (!existsSync(dir) || readdirSync(dir).length === 0) return; // generated at build time
    designs.forEach((d) => d.images.forEach((img) => expect(existsSync(new URL(`../../public/${img.src}`, import.meta.url)), img.src).toBe(true)));
  });

  it('have unique ids', () => {
    expect(new Set(designs.map((d) => d.id)).size).toBe(designs.length);
  });
});

describe('materials and standards', () => {
  it('materials link only to known standards', () => {
    materialsData.materials.forEach((m) => m.standards.forEach((s) => expect(stdIds.has(s), `${m.id}:${s}`).toBe(true)));
  });

  it('every standards document records source metadata honestly', () => {
    const statuses = new Set(standards.reviewStatuses.map((s) => s.id));
    standards.documents.forEach((d) => {
      ['designation', 'title', 'authority', 'edition', 'tier', 'applicability', 'reviewStatus', 'verifiedOn'].forEach((k) => expect(d[k], `${d.id}.${k}`).toBeTruthy());
      expect(statuses.has(d.reviewStatus)).toBe(true);
      // Anything claimed as identified must point at a source
      if (['confirmed', 'secondary', 'superseded'].includes(d.reviewStatus)) expect(d.sources.length, d.id).toBeGreaterThan(0);
    });
  });

  it('keeps cultural guidance in its own tier', () => {
    standards.guidance.filter((g) => g.topic === 'vastu').forEach((g) => expect(g.tier).toBe('cultural'));
  });

  it('collections reference real fields', () => {
    const fields = new Set(['category', 'style', 'climate', 'property', 'budgetTier', 'scope']);
    collections.collections.forEach((c) => Object.keys(c.rule).forEach((k) => expect(fields.has(k), c.id).toBe(true)));
  });
});

describe('versioning', () => {
  it('package.json, release notes and changelog agree', () => {
    expect(RELEASES[0].version).toBe(pkg.version);
    const changelog = readFileSync(new URL('../../CHANGELOG.md', import.meta.url), 'utf8');
    const top = changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m);
    expect(top?.[1]).toBe(pkg.version);
  });
});
