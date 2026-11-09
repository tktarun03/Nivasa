import Swiper from 'swiper';
import { A11y, Keyboard } from 'swiper/modules';
import 'swiper/css';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import { bootPage } from '../app.js';
import { loadDesigns, loadMaterials, nameOf, styleById, cityById, climateById, tierById, relatedDesigns, scopeOfCategory } from '../services/catalog.js';
import { formatRange, sqftToSqm } from '../services/budgetModel.js';
import { frame, wireImages } from '../components/media.js';
import { designCard, bindDesignCards, favButton } from '../components/designCard.js';
import { openBoardPicker } from '../components/boardPicker.js';
import { actionSheet } from '../components/sheet.js';
import { hud } from '../components/toast.js';
import { href, asset } from '../navigation.js';
import { share } from '../services/share.js';
import { isFavourite, setFavourite, toggleFavourite } from '../services/favourites.js';
import { onDoubleTap, onLongPress } from '../interactions/gestures.js';
import { store } from '../storage/store.js';
import { esc, html, raw, prefersReducedMotion } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { haptic } from '../services/haptics.js';

bootPage({ page: 'design', back: 'explore' }, async (ctx) => {
  const root = document.getElementById('design-root');
  const id = ctx.params.get('id');
  const designs = await loadDesigns();
  const d = designs.find((x) => x.id === id);
  if (!d) {
    root.innerHTML = `<div class="state">${icon('images', { cls: 'state__icon' })}<h1 class="h2">Design not found</h1><p>This link may be out of date, or the design was removed from the catalogue.</p><div class="cluster"><a class="btn btn--primary" href="${href('explore')}">Explore designs</a></div></div>`;
    return;
  }
  const { materials } = await loadMaterials();
  const matById = Object.fromEntries(materials.map((m) => [m.id, m]));
  const style = styleById[d.style];
  const climate = climateById[d.climate];
  document.title = `${d.title} · ${document.title.split('·').pop().trim()}`;
  store.update((s) => void (s.recent = [d.id, ...s.recent.filter((x) => x !== d.id)].slice(0, 20)), { silent: true });

  const units = store.get().prefs.units;
  const area = units === 'sqm' ? `${Math.round(sqftToSqm(d.areaSqft))} m² (about ${d.areaSqft} sq ft)` : `${d.areaSqft} sq ft (about ${Math.round(sqftToSqm(d.areaSqft))} m²)`;
  const idx = designs.indexOf(d);
  const prev = designs[(idx - 1 + designs.length) % designs.length];
  const next = designs[(idx + 1) % designs.length];
  const locked = store.get().photoLocks[d.id];

  root.innerHTML = html`
    <div class="split">
      <div>
        <div class="gallery" id="gallery">
          <div class="swiper" id="swiper" aria-label="Design images" role="region">
            <div class="swiper-wrapper">
              ${raw(
                d.images
                  .map(
                    (img, i) =>
                      `<div class="swiper-slide" role="group" aria-label="Image ${i + 1} of ${d.images.length}"><a href="${esc(asset(img.src))}" data-pswp-index="${i}" aria-label="Open image ${i + 1} full screen">${frame(d, i, { eager: i === 0 })}</a></div>`,
                  )
                  .join(''),
              )}
            </div>
          </div>
          <div class="gallery__tools">
            ${raw(favButton(d))}
            <button type="button" class="icon-btn icon-btn--solid" id="lock-photo" aria-pressed="false" aria-label="Lock this photo">${raw(icon('unlock'))}</button>
            <button type="button" class="icon-btn icon-btn--solid" id="fullscreen" aria-label="View full screen">${raw(icon('expand'))}</button>
          </div>
          <span class="locked-pill badge badge--accent" id="locked-pill" hidden>${raw(icon('lock'))} Photo locked</span>
          <button type="button" class="icon-btn icon-btn--solid gallery__nav gallery__nav--prev" id="g-prev" aria-label="Previous image">${raw(icon('chevron-left'))}</button>
          <button type="button" class="icon-btn icon-btn--solid gallery__nav gallery__nav--next" id="g-next" aria-label="Next image">${raw(icon('chevron-right'))}</button>
          <span class="gallery__count" id="g-count" aria-live="polite">1 / ${d.images.length}</span>
        </div>
        <div class="thumbs" id="thumbs" role="group" aria-label="Choose image">
          ${raw(d.images.map((img, i) => `<button type="button" data-thumb="${i}" aria-label="Show image ${i + 1}" aria-current="${i === 0}"><img src="${esc(asset(img.src))}" alt="" loading="lazy" width="72" height="54"></button>`).join(''))}
        </div>
        <p class="tiny muted" style="margin-top:8px">Tip: double-tap the image to favourite, or touch and hold for more actions. ${esc(d.credit)}</p>
      </div>
      <div class="sticky-col">
        <div style="padding-top:20px">
          <p class="eyebrow">${nameOf(d.category)} · ${style?.name}</p>
          <h1 style="margin-top:8px">${d.title}</h1>
          <p class="lede" style="margin-top:12px">${d.summary}</p>
          <div class="cluster" style="margin-top:16px">
            <span class="badge badge--demo">${raw(icon('info'))} Demonstration design · illustration</span>
            <span class="badge">${tierById[d.budgetTier]?.name} ${tierById[d.budgetTier]?.short}</span>
          </div>
          <div class="cluster" style="margin-top:20px">
            <button type="button" class="btn btn--primary" id="save-board">${raw(icon('bookmark-plus'))} Save to board</button>
            <button type="button" class="btn" id="share">${raw(icon('share'))} Share</button>
          </div>
          <div class="card" style="margin-top:24px">
            <p class="eyebrow">Indicative budget</p>
            <p class="budget-range num" style="margin-top:6px">${formatRange(d.budget.low, d.budget.high)}</p>
            <p class="tiny muted" style="margin-top:4px">${d.budget.basis}. Excludes appliances, taxes and design fees.</p>
            <a class="btn btn--sm" style="margin-top:12px" href="${href('budget', { city: d.city, room: d.category, finish: d.budgetTier, area: d.areaSqft })}">${raw(icon('calculator'))} Adjust in budget planner</a>
          </div>
          <h2 class="h3" style="margin-top:32px">Details</h2>
          <dl class="spec-list" style="margin-top:12px">
            <dt>Space</dt><dd><a class="link" href="${href('category', { id: d.category })}">${nameOf(d.category)}</a> · ${scopeOfCategory(d.category) === 'commercial' ? 'Commercial' : 'Residential'}</dd>
            <dt>Style</dt><dd><a class="link" href="${href('styles')}#${d.style}">${style?.name}</a></dd>
            <dt>City</dt><dd>${cityById[d.city]?.name}</dd>
            <dt>Climate</dt><dd>${climate?.name}<span class="tiny muted" style="display:block">${climate?.advice}</span></dd>
            <dt>Property</dt><dd><a class="link" href="${href('category', { id: d.property })}">${nameOf(d.property)}</a></dd>
            <dt>Approx. area</dt><dd class="num">${area}<span class="tiny muted" style="display:block">Illustrative; not a recommended or minimum size.</span></dd>
          </dl>
          <h2 class="h3" style="margin-top:32px">Elements</h2>
          <div class="cluster" style="margin-top:12px">${raw(d.elements.map((e) => `<a class="chip" href="${href('category', { id: e })}">${esc(nameOf(e))}</a>`).join(''))}</div>
          <h2 class="h3" style="margin-top:32px">Materials</h2>
          <ul class="action-list" role="list" style="margin-top:8px">${raw(
            d.materials
              .map((m) => matById[m])
              .filter(Boolean)
              .map((m) => `<li><a href="${href('materials')}#${m.id}">${icon('layers')}<span style="flex:1">${esc(m.name)}<span class="tiny muted" style="display:block">${esc(m.uses[0])}</span></span>${icon('chevron-right')}</a></li>`)
              .join(''),
          )}</ul>
          <p class="tiny muted" style="margin-top:16px">Image licence: ${d.license}</p>
        </div>
      </div>
    </div>
    <section class="section" aria-labelledby="related-title">
      <div class="section-head"><h2 id="related-title">You may also like</h2></div>
      <div class="h-scroll" id="related"></div>
    </section>
    <nav class="cluster" aria-label="More designs" style="justify-content:space-between">
      <a class="btn" href="${href('design', { id: prev.id })}" rel="prev">${raw(icon('chevron-left'))} Previous design</a>
      <a class="btn" href="${href('design', { id: next.id })}" rel="next">Next design ${raw(icon('chevron-right'))}</a>
    </nav>`;
  wireImages(root);

  // ---- Gallery (Swiper) ----
  const swiper = new Swiper('#swiper', {
    modules: [A11y, Keyboard],
    speed: prefersReducedMotion() ? 0 : 380,
    keyboard: { enabled: true, onlyInViewport: true },
    a11y: { enabled: true, prevSlideMessage: 'Previous image', nextSlideMessage: 'Next image' },
    initialSlide: Number.isInteger(locked) ? locked : 0,
  });
  const countEl = document.getElementById('g-count');
  const thumbs = [...document.querySelectorAll('[data-thumb]')];
  const lockBtn = document.getElementById('lock-photo');
  const lockPill = document.getElementById('locked-pill');
  const syncUi = () => {
    const i = swiper.activeIndex;
    countEl.textContent = `${i + 1} / ${d.images.length}`;
    thumbs.forEach((t, n) => t.setAttribute('aria-current', String(n === i)));
    const lockIdx = store.get().photoLocks[d.id];
    const isLocked = Number.isInteger(lockIdx);
    lockBtn.setAttribute('aria-pressed', String(isLocked));
    lockBtn.setAttribute('aria-label', isLocked ? 'Unlock photo' : 'Lock this photo');
    lockBtn.innerHTML = icon(isLocked ? 'lock' : 'unlock', { cls: 'icon-swap' });
    lockPill.hidden = !isLocked;
    swiper.allowTouchMove = !isLocked;
    document.getElementById('g-prev').disabled = isLocked;
    document.getElementById('g-next').disabled = isLocked;
    thumbs.forEach((t, n) => {
      t.disabled = isLocked && n !== lockIdx;
      t.querySelector('.lock-dot')?.remove();
      if (isLocked && n === lockIdx) t.insertAdjacentHTML('beforeend', `<span class="lock-dot">${icon('lock')}</span>`);
    });
  };
  swiper.on('slideChange', syncUi);
  document.getElementById('g-prev').addEventListener('click', () => swiper.slidePrev());
  document.getElementById('g-next').addEventListener('click', () => swiper.slideNext());
  thumbs.forEach((t) => t.addEventListener('click', () => swiper.slideTo(Number(t.dataset.thumb))));
  syncUi();

  // ---- Photo lock: pins the chosen reference image so swipes can't change it ----
  function toggleLock() {
    const current = store.get().photoLocks[d.id];
    const isLocked = Number.isInteger(current);
    const i = swiper.activeIndex;
    const ok = store.update((s) => {
      if (isLocked) delete s.photoLocks[d.id];
      else s.photoLocks[d.id] = i;
    });
    if (!ok) return;
    haptic('medium');
    hud(isLocked ? 'Photo unlocked' : 'Photo locked', isLocked ? 'unlock' : 'lock');
    syncUi();
  }
  lockBtn.addEventListener('click', toggleLock);

  // ---- Full-screen viewer (PhotoSwipe: pinch-zoom, swipe, swipe-down to close) ----
  const lightbox = new PhotoSwipeLightbox({
    dataSource: d.images.map((img) => ({ src: asset(img.src), width: img.width * 2, height: img.height * 2, alt: img.alt })),
    pswpModule: () => import('photoswipe'),
    bgOpacity: 0.94,
    showHideAnimationType: prefersReducedMotion() ? 'none' : 'zoom',
    closeTitle: 'Close (Esc)',
    zoomTitle: 'Zoom',
    arrowPrevTitle: 'Previous image',
    arrowNextTitle: 'Next image',
    loop: false,
  });
  lightbox.on('close', () => {
    const i = lightbox.pswp?.currIndex;
    if (Number.isInteger(i) && !Number.isInteger(store.get().photoLocks[d.id])) swiper.slideTo(i, 0);
    try {
      screen.orientation?.unlock?.();
    } catch {}
  });
  lightbox.on('afterInit', async () => {
    // Keep portrait while viewing, only if the person turned it on and the browser allows it.
    if (!store.get().prefs.keepPortrait || !screen.orientation?.lock) return;
    try {
      await screen.orientation.lock('portrait');
    } catch {
      /* Not permitted on this device/browser (e.g. iOS Safari) — landscape stays available. */
    }
  });
  lightbox.init();
  const openViewer = (i = swiper.activeIndex) => lightbox.loadAndOpen(i);
  document.getElementById('fullscreen').addEventListener('click', () => openViewer());
  root.querySelectorAll('[data-pswp-index]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      clearTimeout(a._t);
      // Wait to see whether this is a double-tap (favourite) before opening the viewer
      a._t = setTimeout(() => openViewer(Number(a.dataset.pswpIndex)), matchMedia('(pointer: coarse)').matches ? 280 : 0);
    }),
  );

  // ---- Gestures on the gallery ----
  const gallery = document.getElementById('gallery');
  onDoubleTap(gallery, (e) => {
    if (e.target.closest('button')) return;
    root.querySelectorAll('[data-pswp-index]').forEach((a) => clearTimeout(a._t));
    if (!isFavourite(d.id)) setFavourite(d.id, true, { title: d.title });
    else hud('Already a favourite', 'heart');
    if (!prefersReducedMotion()) {
      const b = document.createElement('div');
      b.className = 'heart-burst';
      b.innerHTML = icon('heart');
      gallery.appendChild(b);
      setTimeout(() => b.remove(), 720);
    }
  });
  onLongPress(gallery, async () => {
    haptic('medium');
    const lockIdx = store.get().photoLocks[d.id];
    const choice = await actionSheet({
      title: 'Image actions',
      actions: [
        { id: 'view', label: 'View full screen', icon: 'expand' },
        { id: 'lock', label: Number.isInteger(lockIdx) ? 'Unlock photo' : 'Lock this photo', icon: Number.isInteger(lockIdx) ? 'unlock' : 'lock' },
        { id: 'board', label: 'Save this image to a board', icon: 'bookmark-plus' },
        { id: 'share', label: 'Share design', icon: 'share' },
      ],
    });
    if (choice === 'view') openViewer();
    if (choice === 'lock') toggleLock();
    if (choice === 'board') openBoardPicker(d, swiper.activeIndex);
    if (choice === 'share') doShare();
  });

  // ---- Actions ----
  root.addEventListener('click', (e) => {
    const f = e.target.closest('[data-fav]');
    if (f && f.dataset.fav === d.id) toggleFavourite(d.id, { title: d.title });
  });
  document.getElementById('save-board').addEventListener('click', () => openBoardPicker(d, swiper.activeIndex));
  const doShare = () => share({ title: d.title, text: d.summary, url: location.href });
  document.getElementById('share').addEventListener('click', doShare);

  // ---- Related ----
  const rel = document.getElementById('related');
  rel.innerHTML = relatedDesigns(designs, d, 8).map((x) => designCard(x)).join('');
  bindDesignCards(rel, (x) => designs.find((y) => y.id === x));
});
