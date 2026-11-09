/**
 * Design card + list behaviour:
 *  - tap opens the design (deep link)
 *  - heart button favourites (optimistic, undo)
 *  - double-tap the image to favourite (touch) / double-click (mouse)
 *  - touch-and-hold (or right-click) opens an action sheet
 */
import { esc, html, raw } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { href } from '../navigation.js';
import { frame, wireImages } from './media.js';
import { nameOf, styleById, cityById } from '../services/catalog.js';
import { formatRange } from '../services/budgetModel.js';
import { isFavourite, toggleFavourite, setFavourite } from '../services/favourites.js';
import { onDoubleTap, onLongPress } from '../interactions/gestures.js';
import { actionSheet } from './sheet.js';
import { openBoardPicker } from './boardPicker.js';
import { share } from '../services/share.js';
import { prefersReducedMotion } from '../utilities/dom.js';

export function favButton(design, cls = 'icon-btn icon-btn--solid') {
  const on = isFavourite(design.id);
  return `<button type="button" class="${cls} fav-btn" data-fav="${esc(design.id)}" aria-pressed="${on}" aria-label="${on ? 'Remove from favourites' : 'Add to favourites'}">${icon('heart')}</button>`;
}

export function designCard(design, { eager = false, showBudget = true } = {}) {
  return html`<article class="design-card" data-design="${design.id}">
    <a href="${href('design', { id: design.id })}" class="design-card__link" style="text-decoration:none;color:inherit;display:block">
      ${raw(frame(design, 0, { eager }))}
      <div class="design-card__body">
        <h3 class="design-card__title">${design.title}</h3>
        <p class="design-card__meta"><span>${nameOf(design.category)}</span><span>${styleById[design.style]?.name}</span><span>${cityById[design.city]?.name}</span></p>
        ${showBudget ? raw(`<p class="design-card__meta num">${esc(formatRange(design.budget.low, design.budget.high))}</p>`) : ''}
      </div>
    </a>
    <div class="design-card__fav">${raw(favButton(design))}</div>
  </article>`;
}

function burst(frameEl) {
  if (!frameEl || prefersReducedMotion()) return;
  const b = document.createElement('div');
  b.className = 'heart-burst';
  b.innerHTML = icon('heart');
  frameEl.appendChild(b);
  setTimeout(() => b.remove(), 720);
}

/** Wire behaviour for every card inside root. `lookup(id)` returns the design. */
export function bindDesignCards(root, lookup) {
  wireImages(root);
  root.querySelectorAll('.design-card:not([data-bound])').forEach((card) => {
    card.setAttribute('data-bound', '');
    const id = card.dataset.design;
    const f = card.querySelector('.frame');
    const link = card.querySelector('a');
    onDoubleTap(f, (e) => {
      e.preventDefault();
      clearTimeout(link._t);
      link._suppressUntil = Date.now() + 450;
      const d = lookup(id);
      burst(f);
      if (!isFavourite(id)) setFavourite(id, true, { title: d?.title });
    });
    // On touch, wait briefly so a double-tap (favourite) doesn't also open the page.
    link.addEventListener('click', (e) => {
      if (Date.now() < (link._suppressUntil || 0) || e.detail > 1) {
        e.preventDefault();
        clearTimeout(link._t);
        return;
      }
      if (matchMedia('(pointer: coarse)').matches && !e.metaKey && !e.ctrlKey && e.target.closest('.frame')) {
        e.preventDefault();
        clearTimeout(link._t);
        link._t = setTimeout(() => (location.href = link.href), 280);
      }
    });
    onLongPress(card, () => openCardActions(lookup(id)));
    card.addEventListener('contextmenu', (e) => {
      if (e.pointerType === 'mouse' || e.button === 2) {
        e.preventDefault();
        openCardActions(lookup(id));
      }
    });
  });
  if (!root._favBound) {
    root._favBound = true;
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-fav]');
      if (!btn) return;
      e.preventDefault();
      const d = lookup(btn.dataset.fav);
      toggleFavourite(btn.dataset.fav, { title: d?.title });
    });
  }
}

export async function openCardActions(design) {
  if (!design) return;
  const fav = isFavourite(design.id);
  const choice = await actionSheet({
    title: design.title,
    actions: [
      { id: 'open', label: 'Open design', icon: 'expand' },
      { id: 'fav', label: fav ? 'Remove from favourites' : 'Add to favourites', icon: 'heart' },
      { id: 'board', label: 'Save to mood board', icon: 'bookmark-plus' },
      { id: 'share', label: 'Share', icon: 'share' },
    ],
  });
  if (choice === 'open') location.href = href('design', { id: design.id });
  if (choice === 'fav') toggleFavourite(design.id, { title: design.title });
  if (choice === 'board') openBoardPicker(design, 0);
  if (choice === 'share') share({ title: design.title, text: design.summary, url: new URL(href('design', { id: design.id }), location.href).href });
}
