/** Subtle 3D tilt for pointer devices only (no effect on touch or reduced motion). */
import { prefersReducedMotion } from '../utilities/dom.js';

export function initTilt(root = document, max = 5) {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || prefersReducedMotion()) return;
  root.querySelectorAll('.tilt:not([data-tilt-bound])').forEach((el) => {
    el.setAttribute('data-tilt-bound', '');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform 400ms var(--ease-out)';
      el.style.transform = '';
      setTimeout(() => (el.style.transition = ''), 420);
    });
  });
}
