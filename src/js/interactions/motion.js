/**
 * Scroll-linked motion built on GSAP ScrollTrigger, always optional:
 * nothing here runs when the person prefers reduced motion.
 *  - [data-reveal]              fade/slide in once when scrolled into view
 *  - [data-reveal-group] > *    staggered reveal of children (cards)
 *  - [data-parallax]            restrained parallax on a hero image
 *  - [data-zoom-scroll]         subtle zoom-out as the image scrolls through
 * Also: header scroll-progress bar (native, cheap) and SVG path drawing.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, rafThrottle } from '../utilities/dom.js';

let registered = false;
function ensure() {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
}

export function initMotion(root = document) {
  if (prefersReducedMotion()) {
    document.documentElement.classList.remove('js-motion');
    return;
  }
  ensure();
  document.documentElement.classList.add('js-motion');
  revealIn(root);

  root.querySelectorAll('[data-parallax] img').forEach((img) => {
    gsap.fromTo(img, { '--parallax': '-24px' }, {
      '--parallax': '36px',
      ease: 'none',
      scrollTrigger: { trigger: img.closest('[data-parallax]'), start: 'top top', end: 'bottom top', scrub: 0.4 },
    });
  });
  root.querySelectorAll('[data-zoom-scroll] img').forEach((img) => {
    gsap.fromTo(img, { '--zoom': 1.12 }, {
      '--zoom': 1.0,
      ease: 'none',
      scrollTrigger: { trigger: img.closest('[data-zoom-scroll]'), start: 'top bottom', end: 'bottom 40%', scrub: 0.4 },
    });
  });
}

/** Call after inserting new content (infinite scroll) to reveal it. */
export function revealIn(root = document) {
  if (prefersReducedMotion()) return;
  ensure();
  root.querySelectorAll('[data-reveal]:not([data-revealed])').forEach((el) => {
    el.setAttribute('data-revealed', '');
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
  root.querySelectorAll('[data-reveal-group]').forEach((group) => {
    const kids = [...group.children].filter((c) => !c.hasAttribute('data-revealed'));
    if (!kids.length) return;
    kids.forEach((k) => k.setAttribute('data-revealed', ''));
    gsap.set(kids, { opacity: 0, y: 22 });
    ScrollTrigger.batch(kids, {
      start: 'top 94%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.07, overwrite: true }),
    });
  });
  ScrollTrigger.refresh();
}

/** Thin progress bar under the header showing how far the page has been read. */
export function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  const update = rafThrottle(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--progress', max > 0 ? Math.min(1, window.scrollY / max).toFixed(3) : 0);
  });
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/** Draw SVG paths with class .draw-path when they scroll into view. */
export function initPathDrawing(root = document) {
  const paths = root.querySelectorAll('.draw-path');
  paths.forEach((p) => {
    try {
      p.style.setProperty('--len', Math.ceil(p.getTotalLength()));
    } catch {}
  });
  if (prefersReducedMotion()) {
    paths.forEach((p) => p.classList.add('is-drawn'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-drawn');
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.4 },
  );
  paths.forEach((p) => io.observe(p));
}
