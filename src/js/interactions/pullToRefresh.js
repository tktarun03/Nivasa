/**
 * Pull to refresh for touch devices.
 * Browser-safe: only engages when the page is already at the very top and the
 * finger moves down; sets overscroll-behavior so Chrome's own reload does not
 * fire at the same time. Every page using it also has a visible Refresh button.
 */
import { icon } from '../utilities/icons.js';
import { haptic } from '../services/haptics.js';

export function initPullToRefresh(onRefresh, { threshold = 80 } = {}) {
  if (!window.matchMedia('(pointer: coarse)').matches) return () => {};
  document.documentElement.style.overscrollBehaviorY = 'contain';
  const ind = document.createElement('div');
  ind.className = 'ptr';
  ind.setAttribute('aria-hidden', 'true');
  ind.innerHTML = icon('refresh');
  document.body.appendChild(ind);

  let startY = null;
  let pull = 0;
  let busy = false;
  const set = (px) => {
    ind.style.setProperty('--pull', `${px}px`);
    ind.style.setProperty('--pull-o', Math.min(1, px / threshold).toFixed(2));
  };

  const onStart = (e) => {
    if (busy || window.scrollY > 0 || e.touches.length !== 1) return;
    if (e.target.closest('.sheet, .pswp, .h-scroll, input, textarea, [data-no-ptr]')) return;
    startY = e.touches[0].clientY;
    pull = 0;
  };
  const onMove = (e) => {
    if (startY === null) return;
    const dy = e.touches[0].clientY - startY;
    if (dy <= 0 || window.scrollY > 0) {
      startY = null;
      set(0);
      return;
    }
    pull = Math.min(130, dy * 0.5);
    set(pull);
  };
  const onEnd = async () => {
    if (startY === null) return;
    startY = null;
    if (pull >= threshold) {
      busy = true;
      haptic('medium');
      ind.classList.add('is-refreshing');
      set(threshold);
      try {
        await onRefresh();
      } finally {
        ind.classList.remove('is-refreshing');
        busy = false;
        set(0);
      }
    } else set(0);
  };
  window.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onEnd);
  window.addEventListener('touchcancel', onEnd);
  return () => {
    window.removeEventListener('touchstart', onStart);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onEnd);
    window.removeEventListener('touchcancel', onEnd);
    ind.remove();
  };
}
