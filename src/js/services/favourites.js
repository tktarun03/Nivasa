/**
 * Favourites with optimistic UI: the heart flips instantly, the save happens
 * after, and if the save fails the heart flips back and the person is told.
 */
import { store } from '../storage/store.js';
import { toast } from '../components/toast.js';
import { t } from '../i18n.js';
import { haptic } from './haptics.js';
import { announce } from '../utilities/dom.js';

export const isFavourite = (id) => store.get().favourites.includes(id);

function paint(id, on) {
  document.querySelectorAll(`[data-fav="${CSS.escape(id)}"]`).forEach((b) => {
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Remove from favourites' : 'Add to favourites');
    const svg = b.querySelector('svg');
    if (svg) {
      svg.classList.remove('icon-swap');
      void svg.getBoundingClientRect();
      svg.classList.add('icon-swap');
    }
  });
}

export function setFavourite(id, on, { title, quiet = false } = {}) {
  const was = isFavourite(id);
  if (was === on) return true;
  paint(id, on); // optimistic
  const ok = store.update((s) => {
    s.favourites = on ? [id, ...s.favourites.filter((x) => x !== id)] : s.favourites.filter((x) => x !== id);
  });
  if (!ok) {
    paint(id, was); // rollback
    return false;
  }
  haptic(on ? 'success' : 'light');
  announce(on ? `${title || 'Design'} added to favourites` : `${title || 'Design'} removed from favourites`);
  if (!quiet) {
    toast(on ? t('toast.favAdded') : t('toast.favRemoved'), {
      body: title,
      undo: () => setFavourite(id, was, { title, quiet: true }),
    });
  }
  return true;
}

export function toggleFavourite(id, opts) {
  return setFavourite(id, !isFavourite(id), opts);
}
