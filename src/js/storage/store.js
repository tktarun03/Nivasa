/**
 * Local-only persistence. Everything the person saves lives in this browser's
 * localStorage under one versioned key. Nothing is sent anywhere.
 *
 * Rules (from BasKar): every new field gets a default in migrate(); never rename
 * or remove a field without a migration; failed writes are reported, not hidden.
 */

export const STORAGE_KEY = 'iis.data';
export const SCHEMA = 1;

export function defaults() {
  return {
    schema: SCHEMA,
    prefs: {
      city: '',
      propertyType: '',
      bedrooms: '',
      style: '',
      budget: '',
      interests: [],
      units: 'sqft',
      theme: 'system',
      textScale: 1,
      motion: 'system',
      haptics: true,
      language: 'en',
      brandName: '',
      keepPortrait: false,
    },
    onboarding: { done: false, at: null },
    favourites: [],
    boards: [],
    photoLocks: {},
    budgetDraft: null,
    budgetUsed: false,
    recent: [],
    checklistHidden: false,
    lastSeenVersion: null,
    installedVersion: null,
  };
}

/** Bring any stored shape up to the current schema, filling missing fields. */
export function migrate(input) {
  const base = defaults();
  if (!input || typeof input !== 'object') return base;
  const out = { ...base, ...input };
  out.prefs = { ...base.prefs, ...(input.prefs || {}) };
  out.onboarding = { ...base.onboarding, ...(input.onboarding || {}) };
  out.favourites = Array.isArray(input.favourites) ? [...new Set(input.favourites.filter((x) => typeof x === 'string'))] : [];
  out.boards = Array.isArray(input.boards)
    ? input.boards
        .filter((b) => b && typeof b.id === 'string')
        .map((b) => ({
          id: b.id,
          name: String(b.name || 'Untitled board'),
          createdAt: b.createdAt || new Date().toISOString(),
          coverLock: b.coverLock || null,
          items: Array.isArray(b.items)
            ? b.items
                .filter((it) => it && typeof it.designId === 'string')
                .map((it) => ({ designId: it.designId, imageIndex: Number(it.imageIndex) || 0, locked: !!it.locked, addedAt: it.addedAt || null }))
            : [],
        }))
    : [];
  out.photoLocks = input.photoLocks && typeof input.photoLocks === 'object' ? { ...input.photoLocks } : {};
  out.recent = Array.isArray(input.recent) ? input.recent.slice(0, 20) : [];
  out.schema = SCHEMA;
  return out;
}

export function createStore(storage) {
  let state = null;
  const listeners = new Set();
  const errorHandlers = new Set();

  function read() {
    try {
      const raw = storage?.getItem(STORAGE_KEY);
      return migrate(raw ? JSON.parse(raw) : null);
    } catch {
      return migrate(null);
    }
  }

  function get() {
    if (!state) state = read();
    return state;
  }

  /**
   * Apply a change and persist it. Returns true when saved.
   * On failure the in-memory state is rolled back and error handlers run.
   */
  function update(mutator, { silent = false } = {}) {
    const prev = get();
    const draft = structuredClone(prev);
    const result = mutator(draft);
    const next = migrate(result || draft);
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(next));
      state = next;
      if (!silent) listeners.forEach((fn) => fn(state, prev));
      return true;
    } catch (err) {
      state = prev;
      errorHandlers.forEach((fn) => fn(err));
      return false;
    }
  }

  function replaceAll(data) {
    return update(() => migrate(data));
  }

  function reset() {
    try {
      storage?.removeItem(STORAGE_KEY);
    } catch {}
    state = migrate(null);
    listeners.forEach((fn) => fn(state, null));
  }

  return {
    get,
    update,
    replaceAll,
    reset,
    subscribe: (fn) => (listeners.add(fn), () => listeners.delete(fn)),
    onError: (fn) => (errorHandlers.add(fn), () => errorHandlers.delete(fn)),
    /** For tests only */
    _reload: () => (state = read()),
  };
}

function safeLocalStorage() {
  try {
    const t = '__iis_test__';
    window.localStorage.setItem(t, t);
    window.localStorage.removeItem(t);
    return window.localStorage;
  } catch {
    // Private mode or blocked storage: keep data in memory for this visit only.
    const mem = new Map();
    return {
      memoryOnly: true,
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: (k) => mem.delete(k),
    };
  }
}

const backing = typeof window !== 'undefined' ? safeLocalStorage() : null;
export const store = createStore(backing);
export const storageIsMemoryOnly = !!backing?.memoryOnly;
