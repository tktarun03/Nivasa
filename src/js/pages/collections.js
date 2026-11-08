import { bootPage } from '../app.js';
import { loadDesigns, matchesRule } from '../services/catalog.js';
import collectionsData from '../../data/collections.json';
import { designCard, bindDesignCards } from '../components/designCard.js';
import { esc } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';

bootPage({ page: 'collections' }, async () => {
  const designs = await loadDesigns();
  const byId = (id) => designs.find((d) => d.id === id);
  const root = document.getElementById('collections');
  const nav = document.getElementById('col-nav');
  nav.innerHTML = collectionsData.collections.map((c) => `<a class="chip" href="#${esc(c.id)}">${esc(c.title)}</a>`).join('');

  root.innerHTML = collectionsData.collections
    .map((c) => {
      const members = designs.filter((d) => matchesRule(d, c.rule));
      return `<section class="section" id="${esc(c.id)}" aria-labelledby="t-${esc(c.id)}">
        <div class="section-head" data-reveal>
          <div><h2 id="t-${esc(c.id)}">${esc(c.title)}</h2><p>${esc(c.summary)}</p></div>
          <span class="badge">${members.length}</span>
        </div>
        ${
          members.length
            ? `<div class="h-scroll" role="list" aria-label="${esc(c.title)}">${members.map((d) => `<div role="listitem">${designCard(d)}</div>`).join('')}</div>`
            : `<div class="state">${icon('images', { cls: 'state__icon' })}<p>No designs in this collection yet.</p></div>`
        }
      </section>`;
    })
    .join('');
  bindDesignCards(root, byId);

  // Highlight the collection chip for the section in view
  const chips = [...nav.querySelectorAll('a')];
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        chips.forEach((c) => c.classList.toggle('is-active', c.getAttribute('href') === `#${e.target.id}`));
        chips.find((c) => c.classList.contains('is-active'))?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }),
    { rootMargin: '-40% 0px -55% 0px' },
  );
  root.querySelectorAll('section').forEach((s) => io.observe(s));
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
});
