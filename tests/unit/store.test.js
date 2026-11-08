import { describe, it, expect } from 'vitest';
import { createStore, migrate, defaults, STORAGE_KEY } from '../../src/js/storage/store.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
};

describe('store', () => {
  it('migrates empty and partial data to the full shape', () => {
    expect(migrate(null)).toEqual(defaults());
    const m = migrate({ favourites: ['a', 'a', 5], prefs: { city: 'pune' }, boards: [{ id: 'b', items: [{ designId: 'x' }, { nope: 1 }] }] });
    expect(m.favourites).toEqual(['a']);
    expect(m.prefs.city).toBe('pune');
    expect(m.prefs.units).toBe('sqft');
    expect(m.boards[0].name).toBe('Untitled board');
    expect(m.boards[0].items).toEqual([{ designId: 'x', imageIndex: 0, locked: false, addedAt: null }]);
  });

  it('persists updates and notifies subscribers', () => {
    const mem = memory();
    const s = createStore(mem);
    let calls = 0;
    s.subscribe(() => calls++);
    expect(s.update((d) => void d.favourites.push('d1'))).toBe(true);
    expect(JSON.parse(mem.getItem(STORAGE_KEY)).favourites).toEqual(['d1']);
    expect(calls).toBe(1);
  });

  it('rolls back and reports when saving fails', () => {
    const failing = { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); }, removeItem: () => {} };
    const s = createStore(failing);
    let errored = false;
    s.onError(() => (errored = true));
    expect(s.update((d) => void d.favourites.push('d1'))).toBe(false);
    expect(errored).toBe(true);
    expect(s.get().favourites).toEqual([]);
  });

  it('survives corrupt JSON', () => {
    const mem = memory();
    mem.setItem(STORAGE_KEY, '{not json');
    expect(createStore(mem).get()).toEqual(defaults());
  });
});
