/**
 * Image frames with lazy loading and blur-up: the frame paints a blurred
 * gradient taken from the design's own palette, then the image fades in.
 * Broken images show a readable error label instead of a broken icon.
 */
import { esc } from '../utilities/dom.js';
import { asset } from '../navigation.js';
import { styleById } from '../services/catalog.js';
import { placeholderFor } from '../services/roomArt.js';

export function imageFor(design, index = 0) {
  return design.images[index] || design.images[0];
}

export function frame(design, index = 0, { cls = '', eager = false, label = true, sizes = '' } = {}) {
  const img = imageFor(design, index);
  const ph = placeholderFor(styleById[design.style]);
  return `<div class="frame ${cls}" style="--ph:${ph.color};--ph-grad:${esc(ph.gradient)}" data-error="Image unavailable">
    <img src="${esc(asset(img.src))}" alt="${esc(img.alt)}" width="${img.width}" height="${img.height}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${sizes ? `sizes="${sizes}"` : ''}>
    ${label && design.demo ? '<span class="media-label">Illustration</span>' : ''}
  </div>`;
}

/** Mark frames as loaded (or failed). Safe to call repeatedly after rendering. */
export function wireImages(root = document) {
  root.querySelectorAll('.frame img:not([data-wired])').forEach((img) => {
    img.setAttribute('data-wired', '');
    const f = img.closest('.frame');
    const done = () => f?.classList.add('is-loaded');
    const fail = () => f?.classList.add('is-error');
    if (img.complete && img.naturalWidth) done();
    else {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', fail, { once: true });
    }
  });
}

export function skeletonCards(n = 6) {
  return Array.from({ length: n }, () => `<div class="skeleton-card" aria-hidden="true"><div class="skeleton"></div><div class="skeleton skeleton-line" style="width:80%"></div><div class="skeleton skeleton-line" style="width:50%"></div></div>`).join('');
}
