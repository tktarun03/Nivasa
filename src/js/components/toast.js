/**
 * Bottom notices (BasKar pattern). One notice at a time; a new one replaces the old.
 *   toast(title)
 *   toast(title, { kind: 'good' | 'bad', body })
 *   toast(title, { body, undo: fn })
 *   toast(title, { body, action: { label, fn } })
 * Plain 4.5 s · errors 6 s · with a button 7 s. Pauses while hovered or touched.
 */
import { esc } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { t } from '../i18n.js';
import { haptic } from '../services/haptics.js';

let current = null;

export function toast(title, opts = {}) {
  dismiss(true);
  const { kind, body, undo, action } = opts;
  const hasButton = !!(undo || action);
  const duration = opts.duration ?? (hasButton ? 7000 : kind === 'bad' ? 6000 : 4500);

  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', kind === 'bad' ? 'alert' : 'status');
  el.setAttribute('aria-live', kind === 'bad' ? 'assertive' : 'polite');
  const iconHtml = kind === 'good' ? icon('check-circle', { cls: 'toast__icon is-good' }) : kind === 'bad' ? icon('alert-circle', { cls: 'toast__icon is-bad' }) : '';
  const btnLabel = undo ? t('toast.undo') : action?.label;
  el.innerHTML = `${iconHtml}<div class="toast__text"><strong>${esc(title)}</strong>${body ? `<span>${esc(body)}</span>` : ''}</div>${
    hasButton ? `<button type="button" class="toast__action">${esc(btnLabel)}</button>` : ''
  }<button type="button" class="toast__close" aria-label="${esc(t('toast.dismiss'))}">${icon('x')}</button>`;
  document.body.appendChild(el);

  let remaining = duration;
  let started = Date.now();
  let timer = setTimeout(() => dismiss(), remaining);
  const pause = () => {
    clearTimeout(timer);
    remaining -= Date.now() - started;
  };
  const resume = () => {
    started = Date.now();
    clearTimeout(timer);
    timer = setTimeout(() => dismiss(), Math.max(1200, remaining));
  };
  el.addEventListener('pointerenter', pause);
  el.addEventListener('pointerleave', resume);
  el.addEventListener('focusin', pause);
  el.addEventListener('focusout', resume);

  el.querySelector('.toast__close').addEventListener('click', () => dismiss());
  const btn = el.querySelector('.toast__action');
  if (btn) {
    btn.addEventListener('click', () => {
      dismiss();
      haptic('light');
      (undo || action.fn)();
    });
  }
  if (kind === 'bad') haptic('error');
  current = { el, timer: () => clearTimeout(timer) };
  return current;
}

export function dismiss(immediate = false) {
  if (!current) return;
  const { el, timer } = current;
  timer();
  current = null;
  if (immediate) {
    el.remove();
    return;
  }
  el.classList.add('is-leaving');
  setTimeout(() => el.remove(), 230);
}

/** Compact centred confirmation for momentary state changes (e.g. "Photo locked"). */
export function hud(text, iconName = 'check') {
  document.querySelectorAll('.hud').forEach((h) => h.remove());
  const el = document.createElement('div');
  el.className = 'hud';
  el.setAttribute('role', 'status');
  el.innerHTML = `${icon(iconName)}<span>${esc(text)}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1350);
}
