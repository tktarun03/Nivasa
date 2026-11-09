/**
 * Drag to reorder a grid/list using Pointer Events on a handle.
 * Keyboard and screen-reader users get Move earlier / Move later buttons
 * (rendered by the caller), so dragging is never the only way.
 */
export function initReorder(list, { itemSelector, handleSelector, onMove }) {
  let dragEl = null;
  let fromIndex = -1;
  let overEl = null;

  const items = () => [...list.querySelectorAll(itemSelector)];

  list.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest(handleSelector);
    if (!handle) return;
    const item = handle.closest(itemSelector);
    if (!item) return;
    e.preventDefault();
    dragEl = item;
    fromIndex = items().indexOf(item);
    item.classList.add('is-dragging');
    handle.setPointerCapture(e.pointerId);
  });

  list.addEventListener('pointermove', (e) => {
    if (!dragEl) return;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest(itemSelector);
    if (overEl && overEl !== target) overEl.classList.remove('is-drop-target');
    if (target && target !== dragEl && list.contains(target)) {
      target.classList.add('is-drop-target');
      overEl = target;
    } else overEl = null;
    // Auto-scroll near viewport edges
    if (e.clientY < 90) window.scrollBy(0, -12);
    else if (e.clientY > window.innerHeight - 120) window.scrollBy(0, 12);
  });

  const end = () => {
    if (!dragEl) return;
    const to = overEl ? items().indexOf(overEl) : -1;
    dragEl.classList.remove('is-dragging');
    overEl?.classList.remove('is-drop-target');
    const from = fromIndex;
    dragEl = null;
    overEl = null;
    if (to > -1 && to !== from) onMove(from, to);
  };
  list.addEventListener('pointerup', end);
  list.addEventListener('pointercancel', end);
}
