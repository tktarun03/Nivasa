import { bootPage } from '../app.js';
import { loadDesigns } from '../services/catalog.js';
import { openSheet, actionSheet } from '../components/sheet.js';
import { openPopover, openMenu } from '../components/popover.js';
import { toast, hud } from '../components/toast.js';
import { frame, wireImages, skeletonCards } from '../components/media.js';
import { favButton, bindDesignCards } from '../components/designCard.js';
import { onLongPress, onDoubleTap } from '../interactions/gestures.js';
import { initSwipeActions } from '../interactions/swipeActions.js';
import { initReorder } from '../interactions/reorder.js';
import { initPathDrawing } from '../interactions/motion.js';
import { withBusy } from '../interactions/press.js';
import { href } from '../navigation.js';
import { esc, prefersReducedMotion } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { haptic, hapticsSupported } from '../services/haptics.js';

const where = (links) => links.map(([p, label, hash = '']) => `<a class="link" href="${href(p)}${hash}">${esc(label)}</a>`).join(', ');

bootPage({ page: 'patterns' }, async () => {
  const designs = await loadDesigns();
  const byId = (id) => designs.find((d) => d.id === id);
  const d0 = designs[0];
  const root = document.getElementById('patterns-root');

  const P = (id, title, demo, doc, used) => `<article class="pattern" id="${id}" style="margin-top:16px">
      <div class="pattern__demo">${demo}</div>
      <div class="pattern__doc"><h3>${esc(title)}</h3><p>${doc}</p>${used ? `<p class="tiny" style="margin-top:8px">Used in: ${used}</p>` : ''}</div>
    </article>`;
  const G = (id, title, intro, items) => `<section class="section" id="${id}" aria-labelledby="${id}-t"><h2 id="${id}-t">${esc(title)}</h2><p class="small muted" style="margin-top:6px">${intro}</p>${items.join('')}</section>`;

  const groupsHtml = [
    G('scrolling', 'A. Scrolling', 'Native scrolling only — no scroll hijacking. Motion is skipped when reduced motion is on.', [
      P('p-sticky', 'Sticky header and filter bar', `<div style="height:160px;overflow:auto;border:1px solid var(--line);border-radius:12px;background:var(--surface)" tabindex="0" aria-label="Scrollable sticky demo"><div style="position:sticky;top:0;background:var(--glass);backdrop-filter:blur(8px);padding:10px 14px;border-bottom:1px solid var(--line)" class="small"><strong>Sticky filter bar</strong></div>${Array.from({ length: 10 }, (_, i) => `<p class="small" style="padding:8px 14px">Result ${i + 1}</p>`).join('')}</div>`, '<code>position: sticky</code> under the glass header. Keeps search and filters reachable while browsing.', where([['explore', 'Explore'], ['materials', 'Materials']])),
      P('p-snap', 'Scroll snapping', `<div class="h-scroll h-scroll--small" style="margin:0" aria-label="Snap demo">${designs.slice(0, 6).map((d) => `<div>${frame(d, 0, { cls: 'frame--square', label: false })}</div>`).join('')}</div>`, '<code>scroll-snap-type: x mandatory</code> with gutters for horizontal collections; swipe or use a trackpad.', where([['home', 'Home'], ['collections', 'Collections']])),
      P('p-reveal', 'Scroll-triggered staggered reveals', `<div class="list-grid" data-reveal-group>${['Living', 'Kitchen', 'Pooja'].map((t) => `<div class="card">${esc(t)}</div>`).join('')}</div>`, 'GSAP ScrollTrigger batches cards and fades them in with a small stagger, once. Skipped entirely with reduced motion.', where([['explore', 'Explore'], ['styles', 'Styles']])),
      P('p-infinite', 'Infinite scrolling with an end state', `<p class="small">Pages of 12 designs load as a sentinel nears the viewport, with a “Load more” button for keyboards and an end-of-results line when the data runs out.</p>`, 'Real pagination over the catalogue; reset when filters change.', where([['explore', 'Explore'], ['categories', 'Category pages']])),
      P('p-progress', 'Scroll progress indicator', `<p class="small">Look at the thin line under the header as you scroll this page.</p>`, 'Updated with a passive, rAF-throttled scroll listener.', 'every page'),
      P('p-zoom', 'Zoom-on-scroll and restrained parallax', `<p class="small">The home hero image drifts by a few pixels and settles from a 6% zoom as you scroll past.</p>`, 'Scrubbed with ScrollTrigger on a CSS variable so only <code>transform</code> changes.', where([['home', 'Home hero']])),
      P('p-story', 'Scrolltelling', `<p class="small">A sticky illustration changes as each step card reaches the middle of the screen.</p>`, 'IntersectionObserver, no scroll-jacking.', where([['home', 'Home → Project story', '#story-title']])),
    ]),
    G('animation', 'B. Animation', 'Short, purposeful motion that never hides content. All of it respects reduced motion.', [
      P('p-drawer', 'Slide-in panels and drawers', `<button type="button" class="btn" data-demo="sheet">${icon('filters')} Open a bottom sheet</button>`, 'Bottom sheet on phones, centred dialog on desktop. Focus is trapped and returned; Escape or a downward swipe closes it.', where([['explore', 'Filters'], ['design', 'Save to board', `?id=${d0.id}`]])),
      P('p-spring', 'Spring buttons and ripple feedback', `<div class="cluster"><button type="button" class="btn btn--primary" data-demo="noop">Press me</button><button type="button" class="btn">Secondary</button><button type="button" class="icon-btn" aria-label="Icon button">${icon('sparkles')}</button></div>`, 'Overshooting ease on press and a ripple from the touch point.', 'all buttons'),
      P('p-shared', 'Page transitions', `<p class="small">Moving between pages uses cross-document View Transitions in browsers that support them; others navigate normally.</p>`, '<code>@view-transition { navigation: auto }</code> — progressive enhancement only.', 'all pages'),
      P('p-draw', 'SVG path drawing', `<svg viewBox="0 0 320 160" width="100%" style="max-width:420px" role="img" aria-label="Kitchen work triangle between sink, hob and fridge"><rect x="10" y="10" width="300" height="140" rx="8" fill="none" stroke="var(--line-strong)"/><path class="draw-path" d="M60 40 L250 40 L160 120 Z" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/><circle cx="60" cy="40" r="6" fill="var(--ink)"/><circle cx="250" cy="40" r="6" fill="var(--ink)"/><circle cx="160" cy="120" r="6" fill="var(--ink)"/><text x="60" y="66" font-size="11" fill="var(--ink-2)" text-anchor="middle">Sink</text><text x="250" y="66" font-size="11" fill="var(--ink-2)" text-anchor="middle">Hob</text><text x="160" y="142" font-size="11" fill="var(--ink-2)" text-anchor="middle">Fridge</text></svg>`, 'The work-triangle idea (an industry layout habit, not a standard) drawn as it enters view.', ''),
      P('p-marquee', 'Marquee', `<p class="small">The home page's style names drift slowly, pause on hover or focus, have a pause button, and become a static list with reduced motion.</p>`, 'CSS animation; duplicated items are hidden from assistive tech.', where([['home', 'Home → Styles']])),
      P('p-tilt', 'Card tilt on pointer devices', `<div class="card tilt" style="max-width:280px"><strong>Hover me with a mouse</strong><p class="small muted">No tilt on touch screens.</p></div>`, 'Limited to a few degrees; disabled for touch and reduced motion.', where([['styles', 'Styles'], ['home', 'Home tools']])),
      P('p-gooey', 'Morphing icon and gooey toggle', `<div class="cluster"><button type="button" class="icon-btn" data-demo="morph" aria-pressed="false" aria-label="Toggle lock">${icon('unlock')}</button><svg width="0" height="0" aria-hidden="true" style="position:absolute"><filter id="goo"><feGaussianBlur in="SourceGraphic" stdDeviation="6"/><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"/></filter></svg><button type="button" class="gooey" data-demo="goo" aria-pressed="false" aria-label="Gooey toggle" style="position:relative;width:96px;height:44px"><span style="position:absolute;left:8px;top:8px;width:28px;height:28px;border-radius:50%;background:var(--accent);transition:left 400ms var(--ease-spring)" data-goo-dot></span><span style="position:absolute;left:30px;top:14px;width:36px;height:16px;border-radius:8px;background:var(--accent)"></span><span style="position:absolute;right:8px;top:8px;width:28px;height:28px;border-radius:50%;background:var(--accent);opacity:.35"></span></button></div>`, 'Isolated examples only. The lock icon swap is used for the real photo lock.', where([['design', 'Photo lock', `?id=${d0.id}`]])),
    ]),
    G('loading', 'C. Loading', 'Progress is only shown for real work. Nothing fakes a percentage.', [
      P('p-skeleton', 'Skeleton screens', `<div class="design-grid" id="skel-demo" style="grid-template-columns:repeat(3,1fr)">${skeletonCards(3)}</div><button type="button" class="btn btn--sm" style="margin-top:12px" data-demo="skeleton">Load the real cards</button>`, 'Shown while the catalogue chunk loads.', where([['explore', 'Explore'], ['design', 'Design', `?id=${d0.id}`]])),
      P('p-blur', 'Lazy images with blur-up', `<div style="max-width:320px" id="blur-demo">${frame(d0, 1)}</div><button type="button" class="btn btn--sm" style="margin-top:12px" data-demo="blur">Reload image</button>`, 'Native <code>loading="lazy"</code>; a blurred gradient from the design palette shows first.', 'all images'),
      P('p-busy', 'Button loading indicator', `<button type="button" class="btn btn--primary" data-demo="busy">${icon('refresh')} Re-load catalogue</button>`, 'Spinner replaces the label while a real async task runs (here: re-reading the catalogue).', where([['explore', 'Refresh'], ['settings', 'Self-check']])),
      P('p-ring', 'Progress rings and multi-step progress', `<p class="small">The budget planner shows a ring for how much of the form is complete and a four-step indicator; the self-check ring counts real checks.</p>`, 'Values come from measurable state, never timers.', where([['budget', 'Budget planner'], ['settings', 'Self-check', '#check-title']])),
      P('p-optimistic', 'Optimistic favourites with rollback', `<div style="display:flex;gap:12px;align-items:center" id="opt-demo">${favButton(d0, 'icon-btn')} <span class="small">Tap the heart — it changes instantly; if saving fails it flips back and tells you why.</span></div>`, '', where([['explore', 'Every design card']])),
      P('p-ptr', 'Pull to refresh', `<p class="small">On a touch screen, at the top of Explore, pull down and release. A visible refresh button does the same for everyone else.</p>`, 'Only engages at scroll position 0; sets overscroll-behavior so the browser does not reload the page at the same time.', where([['explore', 'Explore']])),
      P('p-states', 'Error, retry, offline and empty states', `<div class="list-grid"><div class="state" style="padding:16px">${icon('search', { cls: 'state__icon' })}<h3>No designs match</h3><p>Suggests what to try.</p></div><div class="state" style="padding:16px">${icon('wifi-off', { cls: 'state__icon' })}<h3>You're offline</h3><p>Opened pages still work.</p></div><div class="state" style="padding:16px">${icon('alert-circle', { cls: 'state__icon' })}<h3>Couldn't load</h3><div class="cluster"><button type="button" class="btn btn--sm">${icon('refresh')} Retry</button></div></div></div>`, '', ''),
    ]),
    G('gestures', 'D. Gestures', 'Each gesture has a visible button alternative. Edges of the screen are left to the operating system.', [
      P('p-longpress', 'Touch and hold', `<div class="card" id="lp-demo" style="user-select:none;-webkit-touch-callout:none;text-align:center">${icon('hand')}<p class="small">Touch and hold here (or right-click)</p></div>`, '500 ms hold opens an action sheet; movement cancels it.', where([['explore', 'Design cards'], ['moodboards', 'Board items']])),
      P('p-dbltap', 'Double-tap to favourite', `<div style="max-width:260px;position:relative;touch-action:manipulation" id="dt-demo">${frame(designs[2], 0)}</div>`, 'Two taps within 300 ms; <code>touch-action: manipulation</code> keeps pinch-zoom working.', where([['explore', 'Design cards'], ['design', 'Gallery', `?id=${d0.id}`]])),
      P('p-swipe', 'Swipe actions', `<div class="swipe-row" id="sw-demo" style="max-width:420px"><div class="swipe-row__actions"><button type="button" data-demo="sw-del">${icon('trash')}Delete</button></div><div class="swipe-row__content"><div class="cat-tile" style="border:0">${icon('bookmark')}<span class="cat-tile__name">Swipe me left</span></div></div></div>`, 'Claims the gesture only when movement is clearly horizontal.', where([['moodboards', 'Mood boards']])),
      P('p-reorder', 'Drag to reorder', `<ol class="board-items" id="ro-demo" style="grid-template-columns:repeat(3,1fr)">${['Sofa', 'Rug', 'Lamp'].map((t) => `<li class="board-item"><div class="board-item__tools"><button type="button" class="icon-btn drag-handle" aria-label="Drag ${t}">${icon('grip')}</button><span class="small">${t}</span></div></li>`).join('')}</ol>`, 'Pointer drag on a handle, plus Move earlier/later buttons on real boards.', where([['moodboards', 'Mood boards']])),
      P('p-pinch', 'Pinch to zoom and swipe between images', `<a class="btn" href="${href('design', { id: d0.id })}">${icon('expand')} Open a design gallery</a>`, 'Swiper in the page; PhotoSwipe full screen with pinch-zoom, swipe and swipe-down to close.', ''),
    ]),
    G('navigation', 'E. Navigation', 'Every control goes somewhere real.', [
      P('p-bottomnav', 'Adaptive bottom navigation', `<p class="small">On phones the bottom bar shrinks to icons while you scroll down and returns when you scroll up. On wide screens it becomes header links.</p>`, '', 'all pages'),
      P('p-accessory', 'Compact bottom accessory panel', `<p class="small">Select two materials to compare and a tray appears above the bottom bar.</p>`, '', where([['materials', 'Materials'], ['budget', 'Budget total']])),
      P('p-scope', 'Scope bar', `<div class="scope-bar" role="group" aria-label="Scope demo" id="scope-demo"><button type="button" aria-pressed="true">All</button><button type="button" aria-pressed="false">Homes</button><button type="button" aria-pressed="false">Commercial</button></div>`, '', where([['explore', 'Explore'], ['styles', 'Styles']])),
      P('p-menu', 'Pull-down menu and anchored popover', `<div class="cluster"><button type="button" class="btn" data-demo="menu" aria-haspopup="menu" aria-expanded="false">${icon('sort')} Sort</button><button type="button" class="btn" data-demo="popover" aria-expanded="false">${icon('info')} What is HDHMR?</button></div>`, 'Arrow keys move through items; Escape closes and returns focus.', where([['explore', 'Sort']])),
      P('p-alpha', 'Alphabetical index', `<p class="small">The materials library has an A–Z strip; tap or drag along it to jump.</p>`, '', where([['materials', 'Materials']])),
      P('p-sheets', 'Modal bottom sheets and action sheets', `<button type="button" class="btn" data-demo="action">${icon('more')} Open an action sheet</button>`, '', ''),
    ]),
    G('feedback', 'F. Feedback', 'Web equivalents of native feedback. There is no Dynamic Island, Live Activity or system haptics on the web, so nothing here claims to be.', [
      P('p-live', 'Live status indicator', `<span class="live-status" data-state="ok">Saved on this device</span> <span class="live-status" data-state="saving">Saving…</span> <span class="live-status" data-state="offline">Offline</span>`, 'Shown in the header: saving, saved, offline, or not saved.', 'all pages'),
      P('p-toast', 'Toasts with Undo, and HUDs', `<div class="cluster"><button type="button" class="btn" data-demo="toast">Plain toast</button><button type="button" class="btn" data-demo="undo">Toast with Undo</button><button type="button" class="btn" data-demo="error">Error toast</button><button type="button" class="btn" data-demo="hud">HUD</button></div>`, 'One at a time, above the bottom bar, pausing while touched (BasKar pattern).', where([['moodboards', 'Mood boards'], ['explore', 'Favourites']])),
      P('p-haptics', 'Optional haptics', `<button type="button" class="btn" data-demo="haptic">${icon('phone')} Vibrate</button> <span class="small muted">${hapticsSupported ? 'Supported here.' : 'Not supported in this browser.'}</span>`, 'Vibration API where supported; can be switched off in Settings.', where([['settings', 'Settings']])),
    ]),
  ];

  root.innerHTML = `<nav aria-label="Pattern groups" class="toc">${[['scrolling', 'Scrolling'], ['animation', 'Animation'], ['loading', 'Loading'], ['gestures', 'Gestures'], ['navigation', 'Navigation'], ['feedback', 'Feedback']].map(([id, l]) => `<a class="chip" href="#${id}">${l}</a>`).join('')}</nav>${groupsHtml.join('')}`;
  wireImages(root);
  initPathDrawing(root);
  bindDesignCards(root.querySelector('#opt-demo'), byId);

  onLongPress(document.getElementById('lp-demo'), () => actionSheet({ title: 'Contextual actions', actions: [{ id: 'a', label: 'Save to board', icon: 'bookmark-plus' }, { id: 'b', label: 'Share', icon: 'share' }] }));
  document.getElementById('lp-demo').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    actionSheet({ title: 'Contextual actions', actions: [{ id: 'a', label: 'Save to board', icon: 'bookmark-plus' }] });
  });
  const dt = document.getElementById('dt-demo');
  onDoubleTap(dt, () => {
    if (prefersReducedMotion()) return hud('Liked', 'heart');
    const b = document.createElement('div');
    b.className = 'heart-burst';
    b.innerHTML = icon('heart');
    dt.querySelector('.frame').appendChild(b);
    setTimeout(() => b.remove(), 720);
  });
  initSwipeActions(document.getElementById('sw-demo'), { width: 84 });
  const ro = document.getElementById('ro-demo');
  initReorder(ro, { itemSelector: '.board-item', handleSelector: '.drag-handle', onMove: (from, to) => {
    const items = [...ro.children];
    const el = items[from];
    if (to > from) items[to].after(el);
    else items[to].before(el);
    toast(`Moved to position ${to + 1}`);
  } });

  root.addEventListener('click', async (e) => {
    const scopeBtn = e.target.closest('#scope-demo button');
    if (scopeBtn) scopeBtn.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === scopeBtn)));
    const b = e.target.closest('[data-demo]');
    if (!b) return;
    const k = b.dataset.demo;
    if (k === 'sheet') openSheet({ title: 'Bottom sheet', body: '<p class="small">Drag the grip down, press Escape, or tap outside to close.</p>' });
    if (k === 'toast') toast('Saved to Living room ideas');
    if (k === 'undo') toast('Removed from board', { body: 'Sea-breeze living', undo: () => toast('Restored', { kind: 'good' }) });
    if (k === 'error') toast("Couldn't save", { kind: 'bad', body: 'Your browser storage is full.', action: { label: 'Back up', fn: () => toast('This is only a demo') } });
    if (k === 'hud') hud('Photo locked', 'lock');
    if (k === 'haptic') haptic('success') || toast('No vibration', { body: hapticsSupported ? 'Haptics are turned off in Settings.' : 'This browser does not support it.' });
    if (k === 'action') actionSheet({ title: 'Design actions', actions: [{ id: 'o', label: 'Open', icon: 'expand' }, { id: 'd', label: 'Delete', icon: 'trash', danger: true }] });
    if (k === 'menu') openMenu(b, { options: [{ id: 'a', label: 'Best match' }, { id: 'b', label: 'Newest' }, { id: 'c', label: 'Budget: low to high' }], selected: 'a', label: 'Sort demo' });
    if (k === 'popover') openPopover(b, '<p class="small" style="padding:6px">High-density, high-moisture-resistant board. See the <a class="link" href="' + href('materials') + '#hdhmr">materials library</a>.</p>', { label: 'HDHMR' });
    if (k === 'morph') {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      b.innerHTML = icon(on ? 'lock' : 'unlock', { cls: 'icon-swap' });
    }
    if (k === 'goo') {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      b.querySelector('[data-goo-dot]').style.left = on ? '60px' : '8px';
    }
    if (k === 'skeleton') {
      const el = document.getElementById('skel-demo');
      await withBusy(b, async () => {
        const ds = await loadDesigns();
        el.innerHTML = ds.slice(3, 6).map((d) => `<div>${frame(d, 0, { cls: 'frame--square', label: false })}</div>`).join('');
        wireImages(el);
      });
    }
    if (k === 'blur') {
      const el = document.getElementById('blur-demo');
      el.innerHTML = frame(d0, 1).replace('.svg"', `.svg?r=${Date.now()}"`);
      wireImages(el);
    }
    if (k === 'busy') await withBusy(b, async () => {
      const ds = await loadDesigns();
      toast('Catalogue loaded', { kind: 'good', body: `${ds.length} designs` });
    });
  });
});
