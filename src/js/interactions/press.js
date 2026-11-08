/**
 * Pressed-state feedback: material-style ripple on buttons and chips, spring
 * scale comes from CSS :active. One delegated listener for the whole page.
 */
import { prefersReducedMotion } from '../utilities/dom.js';

export function initPressFeedback() {
  document.addEventListener(
    'pointerdown',
    (e) => {
      const target = e.target.closest('.btn, .icon-btn, [data-ripple]');
      if (!target || target.disabled || prefersReducedMotion()) return;
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const r = document.createElement('span');
      r.className = 'ripple';
      r.style.width = r.style.height = `${size}px`;
      r.style.left = `${e.clientX - rect.left - size / 2}px`;
      r.style.top = `${e.clientY - rect.top - size / 2}px`;
      target.appendChild(r);
      setTimeout(() => r.remove(), 600);
    },
    { passive: true },
  );
}

/** Button loading state for real async work. Restores label afterwards. */
export async function withBusy(button, task) {
  if (!button) return task();
  button.setAttribute('aria-busy', 'true');
  button.disabled = true;
  try {
    return await task();
  } finally {
    button.removeAttribute('aria-busy');
    button.disabled = false;
  }
}
