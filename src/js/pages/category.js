import { bootPage } from '../app.js';
import { loadDesigns, termById, groups, sortDesigns, paginate, climateById } from '../services/catalog.js';
import { designCard, bindDesignCards } from '../components/designCard.js';
import { skeletonCards } from '../components/media.js';
import { createInfiniteList } from '../interactions/infinite.js';
import { revealIn } from '../interactions/motion.js';
import { href } from '../navigation.js';
import { esc } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';

bootPage({ page: 'category', back: 'categories' }, async (ctx) => {
  const id = ctx.params.get('id');
  const term = termById[id];
  const results = document.getElementById('results');
  if (!term) {
    document.getElementById('cat-title').textContent = 'Category not found';
    document.getElementById('cat-group').textContent = 'Categories';
    results.innerHTML = `<div class="state" style="grid-column:1/-1">${icon('categories', { cls: 'state__icon' })}<h2>We couldn't find that category</h2><p>The link may be out of date.</p><div class="cluster"><a class="btn" href="${href('categories')}">Browse all categories</a></div></div>`;
    return;
  }
  const group = groups.find((g) => g.id === term.group);
  document.title = `${term.name} · ${document.title.split('·').pop().trim()}`;
  document.getElementById('cat-title').textContent = term.name;
  document.getElementById('cat-group').textContent = group.name;
  document.getElementById('cat-desc').textContent =
    group.id === 'elements'
      ? `Designs featuring ${term.name.toLowerCase()}. Open a design to see the materials used.`
      : group.id === 'property'
        ? `Designs planned for a ${term.name}.`
        : `Ideas for ${term.name.toLowerCase()} in Indian homes and climates.`;

  // Sibling categories as quick links
  document.getElementById('cat-related').innerHTML = group.items
    .filter((i) => i.id !== id)
    .slice(0, 12)
    .map((i) => `<a class="chip" href="${href('category', { id: i.id })}">${esc(i.name)}</a>`)
    .join('');

  results.innerHTML = skeletonCards(4);
  const designs = await loadDesigns();
  const byId = (x) => designs.find((d) => d.id === x);
  const field = { rooms: 'category', commercial: 'category', elements: 'elements', property: 'property' }[group.id];
  const list = sortDesigns(designs.filter((d) => (Array.isArray(d[field]) ? d[field].includes(id) : d[field] === id)), 'popular');

  const climates = [...new Set(list.map((d) => d.climate))];
  if (climates.length) {
    document.getElementById('cat-desc').insertAdjacentHTML('afterend', `<p class="small muted" style="margin-top:8px">${list.length} design${list.length === 1 ? '' : 's'} · climates: ${climates.map((c) => esc(climateById[c]?.name)).join(', ')}</p>`);
  }

  const inf = createInfiniteList({
    container: results,
    footer: document.getElementById('results-footer'),
    loadPage: async (page) => paginate(list, page, 8),
    renderItems: (items) => {
      results.insertAdjacentHTML('beforeend', items.map((d) => designCard(d)).join(''));
      bindDesignCards(results, byId);
      revealIn(results.parentElement);
    },
    onEmpty: () => {
      results.innerHTML = `<div class="state" style="grid-column:1/-1">${icon('images', { cls: 'state__icon' })}<h2>No designs here yet</h2><p>This category is part of the catalogue structure, but no demonstration designs have been added to it yet.</p><div class="cluster"><a class="btn" href="${href('explore')}">Explore all designs</a></div></div>`;
    },
    endLabel: (n) => `That's all ${n} in ${term.name}`,
  });
  await inf.reset();
});
