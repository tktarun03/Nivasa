/**
 * Modal bottom sheet (dialog on desktop) and action sheet.
 * - Focus is trapped inside and restored on close; Escape closes.
 * - Drag the grip or header down to dismiss (swipe-to-dismiss).
 * - Body scroll is locked while open.
 */
import { esc } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { t } from '../i18n.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const stack = [];

export function openSheet({ title, body = '', footer = '', onClose, label, className = '', initialFocus } = {}) {
  const opener = document.activeElement;
  const id = `sheet-${Math.random().toString(36).slice(2, 7)}`;
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  const el = document.createElement('div');
  el.className = `sheet ${className}`;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', `${id}-title`);
  el.tabIndex = -1;
  el.innerHTML = `
    <div class="sheet__grip" aria-hidden="true"></div>
    <div class="sheet__head">
      <h2 class="sheet__title" id="${id}-title">${esc(title || label || '')}</h2>
      <button type="button" class="icon-btn" data-close aria-label="${esc(t('common.close'))}">${icon('x')}</button>
    </div>
    <div class="sheet__body">${body}</div>
    ${footer ? `<div class="sheet__foot">${footer}</div>` : ''}`;
  document.body.append(scrim, el);
  document.documentElement.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    scrim.classList.add('is-open');
    el.classList.add('is-open');
    const target = (initialFocus && el.querySelector(initialFocus)) || el.querySelector('.sheet__body ' + FOCUSABLE) || el;
    target.focus({ preventScroll: true });
  });

  let closed = false;
  function close(reason = 'dismiss') {
    if (closed) return;
    closed = true;
    el.classList.remove('is-open');
    el.style.removeProperty('--drag');
    scrim.classList.remove('is-open');
    document.removeEventListener('keydown', onKey, true);
    const idx = stack.indexOf(api);
    if (idx > -1) stack.splice(idx, 1);
    if (!stack.length) document.documentElement.style.overflow = '';
    setTimeout(() => {
      el.remove();
      scrim.remove();
    }, 340);
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    onClose?.(reason);
  }

  function onKey(e) {
    if (stack[stack.length - 1] !== api) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close('escape');
    } else if (e.key === 'Tab') {
      const items = [...el.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  document.addEventListener('keydown', onKey, true);
  scrim.addEventListener('click', () => close('scrim'));
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) close('button');
  });

  // Swipe down to dismiss from the grip or header (not from scrolling content)
  let startY = null;
  let dy = 0;
  const handles = el.querySelectorAll('.sheet__grip, .sheet__head');
  handles.forEach((h) =>
    h.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      if (window.matchMedia('(min-width: 900px)').matches) return;
      startY = e.clientY;
      dy = 0;
      el.classList.add('is-dragging');
      h.setPointerCapture(e.pointerId);
    }),
  );
  handles.forEach((h) =>
    h.addEventListener('pointermove', (e) => {
      if (startY === null) return;
      dy = Math.max(0, e.clientY - startY);
      el.style.setProperty('--drag', `${dy}px`);
    }),
  );
  const end = () => {
    if (startY === null) return;
    startY = null;
    el.classList.remove('is-dragging');
    if (dy > 110) close('swipe');
    else el.style.setProperty('--drag', '0px');
  };
  handles.forEach((h) => {
    h.addEventListener('pointerup', end);
    h.addEventListener('pointercancel', end);
  });

  const api = { el, close, body: el.querySelector('.sheet__body') };
  stack.push(api);
  return api;
}

/**
 * Action sheet: a list of actions. Resolves with the chosen action id or null.
 * actions: [{ id, label, icon, danger }]
 */
export function actionSheet({ title, actions }) {
  return new Promise((resolve) => {
    let chosen = null;
    const body = `<ul class="action-list" role="list">${actions
      .map(
        (a) =>
          `<li><button type="button" data-action="${esc(a.id)}" class="${a.danger ? 'is-danger' : ''}">${a.icon ? icon(a.icon) : ''}<span>${esc(a.label)}</span></button></li>`,
      )
      .join('')}</ul>`;
    const s = openSheet({
      title,
      body,
      onClose: () => resolve(chosen),
    });
    s.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-action]');
      if (!b) return;
      chosen = b.dataset.action;
      s.close('action');
    });
  });
}

/** Confirmation sheet for destructive actions. */
export function confirmSheet({ title, message, confirmLabel = 'Delete', danger = true }) {
  return new Promise((resolve) => {
    let ok = false;
    const s = openSheet({
      title,
      body: `<p class="small" style="color:var(--ink-2)">${esc(message)}</p>`,
      footer: `<button type="button" class="btn" data-close>${esc(t('common.cancel'))}</button><button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-confirm>${esc(confirmLabel)}</button>`,
      onClose: () => resolve(ok),
    });
    s.el.querySelector('[data-confirm]').addEventListener('click', () => {
      ok = true;
      s.close('confirm');
    });
  });
}

/** Prompt sheet with one text field. Resolves with the value or null. */
export function promptSheet({ title, label, value = '', placeholder = '', confirmLabel = 'Save', maxLength = 60 }) {
  return new Promise((resolve) => {
    let result = null;
    const s = openSheet({
      title,
      body: `<form class="field" id="prompt-form"><label for="prompt-input">${esc(label)}</label><input class="input" id="prompt-input" name="v" maxlength="${maxLength}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off" required></form>`,
      footer: `<button type="button" class="btn" data-close>${esc(t('common.cancel'))}</button><button type="submit" form="prompt-form" class="btn btn--primary">${esc(confirmLabel)}</button>`,
      initialFocus: '#prompt-input',
      onClose: () => resolve(result),
    });
    s.el.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = s.el.querySelector('#prompt-input').value.trim();
      if (!v) return;
      result = v;
      s.close('submit');
    });
  });
}
