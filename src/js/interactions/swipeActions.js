/**
 * Swipe-left to reveal row actions (iOS-mail style). The same actions are also
 * available from visible buttons on each row.
 */
import { onHorizontalSwipe } from './gestures.js';

export function initSwipeActions(row, { width = 168 } = {}) {
  const content = row.querySelector('.swipe-row__content');
  let open = false;
  onHorizontalSwipe(row, {
    onStart: () => row.classList.add('is-dragging'),
    onMove: (dx) => {
      const base = open ? -width : 0;
      const x = Math.max(-width - 30, Math.min(0, base + dx));
      content.style.setProperty('--sx', `${x}px`);
    },
    onEnd: (dx) => {
      row.classList.remove('is-dragging');
      const base = open ? -width : 0;
      open = base + dx < -width / 2;
      content.style.setProperty('--sx', open ? `-${width}px` : '0px');
      row.dataset.open = open;
    },
  });
  const close = () => {
    open = false;
    content.style.setProperty('--sx', '0px');
    row.dataset.open = 'false';
  };
  return { close };
}
