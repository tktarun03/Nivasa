/**
 * Alphabetical section index for long lists (materials library).
 * Tap a letter or drag along the strip to scrub; a bubble shows the letter.
 * Letters without a section are disabled. Buttons are keyboard focusable.
 */
import { esc } from '../utilities/dom.js';

export function initAlphaIndex({ sections, mount }) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const available = new Set(Object.keys(sections));
  const strip = document.createElement('nav');
  strip.className = 'alpha-index';
  strip.setAttribute('aria-label', 'Jump to letter');
  strip.innerHTML = letters
    .map((l) => `<button type="button" data-letter="${l}" ${available.has(l) ? '' : 'disabled'} aria-label="Jump to ${l}">${esc(l)}</button>`)
    .join('');
  (mount || document.body).appendChild(strip);
  let bubble = null;

  const go = (l) => {
    if (!available.has(l)) return;
    const target = sections[l];
    const y = target.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 120);
    window.scrollTo({ top: y, behavior: 'auto' });
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.className = 'alpha-bubble';
      bubble.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bubble);
    }
    bubble.textContent = l;
    clearTimeout(go.t);
    go.t = setTimeout(() => {
      bubble?.remove();
      bubble = null;
    }, 600);
  };

  strip.addEventListener('click', (e) => {
    const b = e.target.closest('[data-letter]');
    if (b) go(b.dataset.letter);
  });
  let scrubbing = false;
  strip.addEventListener('pointerdown', (e) => {
    scrubbing = true;
    strip.setPointerCapture(e.pointerId);
  });
  strip.addEventListener('pointermove', (e) => {
    if (!scrubbing) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const l = el?.dataset?.letter;
    if (l) go(l);
  });
  const stop = () => (scrubbing = false);
  strip.addEventListener('pointerup', stop);
  strip.addEventListener('pointercancel', stop);
  return strip;
}
