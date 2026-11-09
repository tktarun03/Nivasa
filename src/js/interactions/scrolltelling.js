/**
 * Scrolltelling: a sticky visual changes as the reader scrolls through steps.
 * Uses IntersectionObserver (no scroll hijacking); with reduced motion the
 * images simply swap without fading.
 */
export function initScrolltelling(root) {
  const imgs = [...root.querySelectorAll('.story__visual img')];
  const steps = [...root.querySelectorAll('.story__step')];
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        steps.forEach((s) => s.classList.toggle('is-active', s === e.target));
        const idx = Number(e.target.dataset.img) || 0;
        imgs.forEach((im, i) => im.classList.toggle('is-active', i === idx));
      });
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );
  steps.forEach((s) => io.observe(s));
}
