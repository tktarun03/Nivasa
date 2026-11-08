/**
 * Anchored popover and pull-down menu (menu button pattern).
 * Positions under the anchor, flips above if there is no room, closes on
 * Escape, outside click, scroll or resize. Arrow keys move through menu items.
 */
import { esc } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';

let open = null;

export function closePopover() {
  if (!open) return;
  const { el, anchor, cleanup } = open;
  open = null;
  cleanup();
  el.remove();
  anchor.setAttribute('aria-expanded', 'false');
}

export function openPopover(anchor, content, { role = 'dialog', label = '', arrow = true, onClose } = {}) {
  closePopover();
  const el = document.createElement('div');
  el.className = 'popover';
  el.setAttribute('role', role);
  if (label) el.setAttribute('aria-label', label);
  if (arrow) el.setAttribute('data-arrow', '');
  el.innerHTML = content;
  document.body.appendChild(el);
  anchor.setAttribute('aria-expanded', 'true');

  const place = () => {
    const r = anchor.getBoundingClientRect();
    const pw = el.offsetWidth;
    const ph = el.offsetHeight;
    let left = Math.min(Math.max(12, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 12);
    let top = r.bottom + 10;
    if (top + ph > window.innerHeight - 12 && r.top - ph - 10 > 12) {
      top = r.top - ph - 10;
      el.removeAttribute('data-arrow');
    }
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.setProperty('--arrow-x', `${r.left + r.width / 2 - left - 5}px`);
    el.style.setProperty('--origin', `${r.left + r.width / 2 - left}px 0`);
  };
  place();

  const onDoc = (e) => {
    if (!el.contains(e.target) && !anchor.contains(e.target)) closePopover();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') {
      closePopover();
      anchor.focus();
    }
  };
  const onScroll = () => closePopover();
  setTimeout(() => document.addEventListener('pointerdown', onDoc), 0);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  const cleanup = () => {
    document.removeEventListener('pointerdown', onDoc);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onScroll);
    window.removeEventListener('scroll', onScroll, { capture: true });
    onClose?.();
  };
  open = { el, anchor, cleanup };
  return el;
}

/**
 * Pull-down menu. options: [{ id, label, icon? }], selected id optional.
 * Resolves with the chosen id (or null).
 */
export function openMenu(anchor, { options, selected, label }) {
  return new Promise((resolve) => {
    let chosen = null;
    const markup = options
      .map(
        (o) =>
          `<button type="button" class="menu-item" role="menuitemradio" aria-checked="${o.id === selected}" data-id="${esc(o.id)}">${o.icon ? icon(o.icon) : ''}<span>${esc(o.label)}</span>${icon('check', { cls: 'menu-check' })}</button>`,
      )
      .join('');
    const el = openPopover(anchor, markup, { role: 'menu', label, arrow: false, onClose: () => resolve(chosen) });
    const items = [...el.querySelectorAll('.menu-item')];
    (items.find((i) => i.getAttribute('aria-checked') === 'true') || items[0])?.focus();
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.menu-item');
      if (!b) return;
      chosen = b.dataset.id;
      closePopover();
      anchor.focus();
    });
    el.addEventListener('keydown', (e) => {
      const i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(i + 1) % items.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(i - 1 + items.length) % items.length].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        items[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        items[items.length - 1].focus();
      }
    });
  });
}
