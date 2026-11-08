import { bootPage } from '../app.js';
import { loadDesigns, styles, matchesRule, nameOf, styleById } from '../services/catalog.js';
import collectionsData from '../../data/collections.json';
import { designCard, bindDesignCards } from '../components/designCard.js';
import { frame, wireImages, skeletonCards } from '../components/media.js';
import { href } from '../navigation.js';
import { esc, html, raw } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { store } from '../storage/store.js';
import { revealIn } from '../interactions/motion.js';
import { initScrolltelling } from '../interactions/scrolltelling.js';
import { openOnboarding } from '../components/onboarding.js';

bootPage({ page: 'home' }, async (ctx) => {
  const featuredEl = document.getElementById('featured');
  featuredEl.innerHTML = skeletonCards(3).replace(/skeleton-card/g, 'skeleton-card" role="listitem');
  const designs = await loadDesigns();
  const byId = (id) => designs.find((d) => d.id === id);

  // Featured carousel (scroll-snap)
  const featured = designs.filter((d) => d.featured);
  featuredEl.innerHTML = featured.map((d, i) => `<div role="listitem">${designCard(d, { eager: i < 2 })}</div>`).join('');
  bindDesignCards(featuredEl, byId);

  // Personalised section
  const renderForYou = () => {
    const p = store.get().prefs;
    const section = document.getElementById('foryou-section');
    const reasons = [];
    let picks = designs;
    if (p.style) {
      picks = picks.filter((d) => d.style === p.style);
      reasons.push(styleById[p.style]?.name);
    }
    if (p.interests?.length) {
      const narrowed = picks.filter((d) => p.interests.includes(d.category) || (p.interests.includes('office') && ['office', 'coworking', 'retail', 'cafe', 'restaurant', 'salon', 'clinic'].includes(d.category)));
      if (narrowed.length) {
        picks = narrowed;
        reasons.push(p.interests.map(nameOf).join(', '));
      }
    }
    if (p.city) {
      const near = picks.filter((d) => d.city === p.city);
      if (near.length >= 2) {
        picks = near;
        reasons.push(nameOf(p.city));
      }
    }
    if (!reasons.length || !picks.length) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    document.getElementById('foryou-why').textContent = `Based on: ${reasons.join(' · ')}. Change this in Settings.`;
    const grid = document.getElementById('foryou');
    grid.innerHTML = picks.slice(0, 6).map((d) => designCard(d)).join('');
    bindDesignCards(grid, byId);
    revealIn(section);
  };
  renderForYou();
  ctx.onPreferencesChanged = () => {
    renderForYou();
    renderChecklist();
  };

  // Get-started checklist (BasKar pattern) — ticks itself off from real data
  const renderChecklist = () => {
    const s = store.get();
    const box = document.getElementById('getting-started');
    if (s.checklistHidden) {
      box.hidden = true;
      return;
    }
    const steps = [
      { done: s.onboarding.done && !!(s.prefs.city || s.prefs.style || s.prefs.interests.length), label: 'Tell us about your home', link: href('settings') + '#preferences', cta: 'Set up' },
      { done: s.favourites.length > 0, label: 'Favourite a design', link: href('explore'), cta: 'Explore' },
      { done: s.boards.length > 0, label: 'Create a mood board', link: href('moodboards'), cta: 'Create' },
      { done: !!s.budgetUsed, label: 'Try the budget planner', link: href('budget'), cta: 'Plan' },
    ];
    const n = steps.filter((x) => x.done).length;
    if (n === steps.length) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.innerHTML = `<div class="card">
      <div class="section-head" style="margin-bottom:8px"><div><p class="eyebrow">Get started</p><h2 class="h3">${n} of ${steps.length} done</h2></div>
      <button type="button" class="btn btn--ghost btn--sm" data-hide-checklist>Hide</button></div>
      <div class="progress" role="progressbar" aria-label="Getting started progress" aria-valuemin="0" aria-valuemax="${steps.length}" aria-valuenow="${n}"><span style="--value:${n / steps.length}"></span></div>
      <ul class="checklist" style="margin-top:8px">${steps
        .map((st) => `<li class="${st.done ? 'is-done' : ''}"><span class="tick">${icon('check')}</span><span class="check-text">${esc(st.label)}</span>${st.done ? '<span class="sr-only">(done)</span>' : `<a class="btn btn--sm" href="${esc(st.link)}">${esc(st.cta)}</a>`}</li>`)
        .join('')}</ul></div>`;
    box.querySelector('[data-hide-checklist]').addEventListener('click', () => {
      store.update((d) => void (d.checklistHidden = true));
      box.hidden = true;
    });
  };
  renderChecklist();
  if (!store.get().onboarding.done) {
    // keep a quick way back into the tour if someone skipped
  } else if (!store.get().prefs.city && !store.get().prefs.style) {
    const gs = document.getElementById('getting-started');
    gs.insertAdjacentHTML('beforeend', `<p class="small muted" style="margin-top:8px">Skipped the tour? <button type="button" class="link" data-replay style="padding:0">Replay it</button></p>`);
    gs.querySelector('[data-replay]')?.addEventListener('click', () => openOnboarding({ onDone: ctx.onPreferencesChanged }));
  }

  // Style marquee (pausable; static list when motion is reduced)
  const marquee = document.getElementById('style-marquee');
  const items = styles.map((s) => `<a class="marquee__item" href="${href('explore', { style: s.id })}">${esc(s.name)}</a>`).join('<span class="marquee__item" aria-hidden="true">·</span>');
  marquee.innerHTML = `<div class="marquee__track">${items}<span class="marquee__item" aria-hidden="true">·</span><span aria-hidden="true" style="display:contents">${items.replace(/<a /g, '<a tabindex="-1" ')}</span></div>`;
  const toggle = document.getElementById('marquee-toggle');
  toggle.addEventListener('click', () => {
    const paused = marquee.classList.toggle('is-paused');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Play moving style list' : 'Pause moving style list');
    toggle.innerHTML = icon(paused ? 'play' : 'pause');
  });

  // Scrolltelling: one project told in steps
  const story = byId('athangudi-floored-drawing-room');
  const steps = [
    { img: 0, eyebrow: 'Step 1 · The floor', title: 'Start with Athangudi tiles', text: 'Hand-made in Athangudi village and cured slowly, the patterned cement tiles set the palette for the whole room.' },
    { img: 1, eyebrow: 'Step 2 · Materials', title: 'Teak, lime and brass', text: 'Seasoned teak for pillars, lime-washed walls that breathe, and brass that warms with age.' },
    { img: 2, eyebrow: 'Step 3 · Living in it', title: 'Arrange for air and light', text: 'Low seating and open sightlines keep the breeze moving through a hot, humid Chennai afternoon.' },
  ];
  document.getElementById('story').innerHTML = html`
    <div class="story__visual" aria-hidden="true">${raw(story.images.map((im, i) => `<img src="${esc(new URL(href('home'), location.href).href.replace(/index\.html.*$/, '') + im.src)}" alt="" class="${i === 0 ? 'is-active' : ''}" loading="lazy" width="1200" height="900">`).join(''))}</div>
    <div class="story__steps">${raw(
      steps
        .map(
          (s, i) =>
            `<div class="story__step ${i === 0 ? 'is-active' : ''}" data-img="${s.img}"><div class="story__card"><p class="eyebrow">${esc(s.eyebrow)}</p><h3>${esc(s.title)}</h3><p class="small muted" style="margin-top:8px">${esc(s.text)}</p>${i === steps.length - 1 ? `<a class="btn btn--sm" style="margin-top:16px" href="${href('design', { id: story.id })}">Open this design ${icon('chevron-right')}</a>` : ''}</div></div>`,
        )
        .join(''),
    )}</div>`;
  initScrolltelling(document.getElementById('story'));

  // Collections
  const colEl = document.getElementById('collections');
  colEl.innerHTML = collectionsData.collections
    .map((c) => {
      const members = designs.filter((d) => matchesRule(d, c.rule));
      const cover = members[0];
      return `<a role="listitem" class="design-card" href="${href('collections')}#${esc(c.id)}" style="text-decoration:none">${cover ? frame(cover, 0, { cls: 'frame--square', label: false }) : ''}<div class="design-card__body"><h3 class="design-card__title">${esc(c.title)}</h3><p class="design-card__meta">${members.length} designs</p></div></a>`;
    })
    .join('');
  wireImages(colEl);
});
