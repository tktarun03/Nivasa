/** Small DOM and formatting helpers shared by every page. */

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Escape any user or external text before it goes into HTML. */
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** Tagged template that escapes interpolations unless wrapped with raw(). */
export function html(strings, ...values) {
  return strings.reduce((out, str, i) => {
    if (i >= values.length) return out + str;
    const v = values[i];
    let s;
    if (v && v.__raw) s = v.value;
    else if (Array.isArray(v)) s = v.map((x) => (x && x.__raw ? x.value : esc(x))).join('');
    else if (v === false || v === null || v === undefined) s = '';
    else s = esc(v);
    return out + str + s;
  }, '');
}
export const raw = (value) => ({ __raw: true, value: String(value ?? '') });

export function setHTML(el, markup) {
  if (el) el.innerHTML = markup;
  return el;
}

export function debounce(fn, ms = 180) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function rafThrottle(fn) {
  let queued = false;
  let lastArgs;
  return (...args) => {
    lastArgs = args;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn(...lastArgs);
    });
  };
}

export function params() {
  return new URLSearchParams(location.search);
}

export function updateQuery(obj, { replace = true } = {}) {
  const url = new URL(location.href);
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) url.searchParams.delete(k);
    else url.searchParams.set(k, Array.isArray(v) ? v.join(',') : v);
  });
  history[replace ? 'replaceState' : 'pushState'](history.state, '', url);
}

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function formatDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  try {
    return new Intl.DateTimeFormat('en-IN', opts).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

/** Announce text to screen readers through the shared live region. */
export function announce(text) {
  const el = document.getElementById('sr-live');
  if (!el) return;
  el.textContent = '';
  setTimeout(() => (el.textContent = text), 30);
}

export function prefersReducedMotion() {
  return (
    document.documentElement.dataset.motion === 'reduce' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function isTouch() {
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}
