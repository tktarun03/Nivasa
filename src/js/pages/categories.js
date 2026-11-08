import Fuse from 'fuse.js';
import { bootPage } from '../app.js';
import { loadDesigns, groups } from '../services/catalog.js';
import { href } from '../navigation.js';
import { esc, debounce, announce } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { imageFor } from '../components/media.js';
import { asset } from '../navigation.js';

bootPage({ page: 'categories' }, async () => {
  const designs = await loadDesigns();
  const root = document.getElementById('groups');
  const fieldFor = { rooms: 'category', commercial: 'category', elements: 'elements', property: 'property', styles: 'style' };

  const countAndCover = (groupId, itemId) => {
    const field = fieldFor[groupId];
    const matches = designs.filter((d) => (Array.isArray(d[field]) ? d[field].includes(itemId) : d[field] === itemId));
    return { n: matches.length, cover: matches[0] };
  };

  const all = groups.flatMap((g) => g.items.map((it) => ({ ...it, group: g.id, groupName: g.name })));
  const fuse = new Fuse(all, { keys: ['name', 'keywords', 'groupName'], threshold: 0.35, ignoreLocation: true });

  const tile = (g, it) => {
    const { n, cover } = countAndCover(g.id, it.id);
    const link = g.id === 'styles' ? href('explore', { style: it.id }) : href('category', { id: it.id });
    const thumb = cover ? `<img src="${esc(asset(imageFor(cover, 0).src))}" alt="" loading="lazy" width="48" height="48">` : '';
    return `<a class="cat-tile" href="${link}"><span class="cat-tile__thumb">${thumb}</span><span><span class="cat-tile__name">${esc(it.name)}</span><span class="cat-tile__count" style="display:block">${n ? `${n} design${n === 1 ? '' : 's'}` : 'Coming soon — no designs yet'}</span></span>${icon('chevron-right')}</a>`;
  };

  function render(q = '') {
    if (q.trim()) {
      const hits = fuse.search(q.trim()).map((h) => h.item);
      announce(`${hits.length} categories found`);
      root.innerHTML = hits.length
        ? `<section class="section--tight"><h2 class="h3" style="margin-bottom:12px">${hits.length} matching categories</h2><div class="list-grid">${hits.map((it) => tile(groups.find((g) => g.id === it.group), it)).join('')}</div></section>`
        : `<div class="state">${icon('search', { cls: 'state__icon' })}<h2>No categories match “${esc(q)}”</h2><p>Try a room name like “kitchen”, an element like “false ceiling”, or a style like “Kerala”.</p></div>`;
      return;
    }
    root.innerHTML = groups
      .map(
        (g) => `<section class="section--tight" aria-labelledby="g-${g.id}" style="padding-block:24px">
          <div class="section-head"><div><h2 id="g-${g.id}">${esc(g.name)}</h2><p>${esc(g.description)}</p></div><span class="badge">${g.items.length}</span></div>
          <div class="list-grid">${g.items.map((it) => tile(g, it)).join('')}</div>
        </section>`,
      )
      .join('');
  }
  render();
  document.getElementById('cat-q').addEventListener('input', debounce((e) => render(e.target.value), 150));
});
