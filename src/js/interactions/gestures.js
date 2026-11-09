/**
 * Touch gestures built on Pointer Events, designed not to fight the browser:
 *  - Long press: 500 ms hold without moving; suppresses the click that follows.
 *  - Double tap: two taps within 300 ms on the same element (elements use
 *    touch-action: manipulation, so this never blocks pinch-zoom).
 *  - Horizontal swipe: only claims the gesture once movement is clearly sideways,
 *    leaving vertical scrolling and the iOS edge-back gesture alone.
 * Every gesture has a visible button alternative elsewhere in the UI.
 */

export function onLongPress(el, callback, { delay = 500, tolerance = 10 } = {}) {
  let timer = null;
  let start = null;
  let fired = false;
  const clear = () => {
    clearTimeout(timer);
    timer = null;
  };
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    fired = false;
    start = { x: e.clientX, y: e.clientY };
    clear();
    timer = setTimeout(() => {
      fired = true;
      callback(e);
    }, delay);
  });
  el.addEventListener('pointermove', (e) => {
    if (!start) return;
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > tolerance) clear();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => el.addEventListener(t, clear));
  el.addEventListener(
    'click',
    (e) => {
      if (fired) {
        e.preventDefault();
        e.stopPropagation();
        fired = false;
      }
    },
    true,
  );
  el.addEventListener('contextmenu', (e) => {
    // Right-click on desktop opens the same actions
    if (e.pointerType === 'touch' || fired) e.preventDefault();
  });
}

/** Delegated version for lists: selector matched inside root. */
export function delegateLongPress(root, selector, callback, opts) {
  const bound = new WeakSet();
  const bind = () =>
    root.querySelectorAll(selector).forEach((el) => {
      if (bound.has(el)) return;
      bound.add(el);
      onLongPress(el, (e) => callback(el, e), opts);
    });
  bind();
  return bind;
}

export function onDoubleTap(el, callback, { interval = 300 } = {}) {
  let last = 0;
  let lastX = 0;
  let lastY = 0;
  el.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') return; // desktop uses dblclick
    const now = Date.now();
    if (now - last < interval && Math.hypot(e.clientX - lastX, e.clientY - lastY) < 30) {
      last = 0;
      callback(e);
    } else {
      last = now;
      lastX = e.clientX;
      lastY = e.clientY;
    }
  });
  el.addEventListener('dblclick', (e) => {
    e.preventDefault();
    callback(e);
  });
}

/** Horizontal swipe. Calls onMove(dx) while dragging and onEnd(dx) on release. */
export function onHorizontalSwipe(el, { onStart, onMove, onEnd, edgeGuard = 24 } = {}) {
  let sx = 0;
  let sy = 0;
  let active = false;
  let decided = false;
  let dx = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.clientX < edgeGuard || e.clientX > window.innerWidth - edgeGuard) return; // leave OS edge gestures alone
    sx = e.clientX;
    sy = e.clientY;
    active = true;
    decided = false;
    dx = 0;
  });
  el.addEventListener('pointermove', (e) => {
    if (!active) return;
    const mx = e.clientX - sx;
    const my = e.clientY - sy;
    if (!decided) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      decided = true;
      if (Math.abs(my) > Math.abs(mx)) {
        active = false; // vertical: let the page scroll
        return;
      }
      el.setPointerCapture?.(e.pointerId);
      onStart?.();
    }
    dx = mx;
    onMove?.(dx);
  });
  const end = () => {
    if (active && decided) onEnd?.(dx);
    active = false;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}
