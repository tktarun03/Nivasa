import { bootPage } from '../app.js';
import { loadDesigns, styles } from '../services/catalog.js';
import stylesData from '../../data/styles.json';
import { frame, wireImages } from '../components/media.js';
import { openSheet } from '../components/sheet.js';
import { href } from '../navigation.js';
import { esc } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { initTilt } from '../interactions/tilt.js';
import { revealIn } from '../interactions/motion.js';
import { loadMaterials } from '../services/catalog.js';

bootPage({ page: 'styles' }, async () => {
  const designs = await loadDesigns();
  const { materials } = await loadMaterials();
  const matName = (id) => materials.find((m) => m.id === id)?.name || id.replace(/-/g, ' ');
  const scopeEl = document.getElementById('style-scope');
  const listEl = document.getElementById('style-list');
  let scope = 'all';
  scopeEl.innerHTML = [['all', 'All'], ['regional', 'Indian regional'], ['global', 'Contemporary global']]
    .map(([id, l]) => `<button type="button" data-scope="${id}" aria-pressed="${id === scope}">${l}</button>`)
    .join('');

  const swatches = (p) => `<div class="swatches" aria-hidden="true">${['wall', 'wall2', 'wood', 'accent', 'fabric'].map((k) => `<span class="swatch" style="background:${p[k]}"></span>`).join('')}</div>`;

  function render() {
    const list = styles.filter((s) => scope === 'all' || s.kind === scope);
    listEl.innerHTML = list
      .map((s) => {
        const sample = designs.find((d) => d.style === s.id);
        const n = designs.filter((d) => d.style === s.id).length;
        return `<article class="card tilt" id="${esc(s.id)}" style="padding:0;overflow:hidden">
          ${sample ? frame(sample, 0, { cls: 'frame--wide' }).replace('class="frame', 'style="border-radius:0" class="frame') : ''}
          <div style="padding:16px 20px 20px">
            <div class="cluster" style="justify-content:space-between"><p class="eyebrow">${esc(s.origin)}</p>${swatches(s.palette)}</div>
            <h2 class="h3" style="margin-top:6px">${esc(s.name)}</h2>
            <p class="small" style="margin-top:6px;color:var(--ink-2)">${esc(s.summary)}</p>
            <div class="cluster" style="margin-top:14px">
              <button type="button" class="btn btn--sm" data-detail="${esc(s.id)}">About this style</button>
              <a class="btn btn--sm btn--ghost" href="${href('explore', { style: s.id })}">${n} design${n === 1 ? '' : 's'} ${icon('chevron-right')}</a>
            </div>
          </div></article>`;
      })
      .join('');
    wireImages(listEl);
    initTilt(listEl, 3);
    revealIn(listEl.parentElement);
  }

  function detail(id) {
    const s = styles.find((x) => x.id === id);
    openSheet({
      title: s.name,
      body: `<p class="small muted">${esc(s.origin)} · ${s.kind === 'regional' ? 'Indian regional inspiration' : 'Contemporary global style'}</p>
        <p style="margin-top:12px;color:var(--ink-2)">${esc(s.summary)}</p>
        <h3 class="h3" style="margin-top:20px;font-size:var(--fs-md)">Signature elements</h3>
        <ul class="small" style="padding-left:1.1em;margin:8px 0 0;color:var(--ink-2)">${s.signature.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <h3 class="h3" style="margin-top:20px;font-size:var(--fs-md)">Typical materials</h3>
        <div class="cluster" style="margin-top:8px">${s.materials.map((m) => `<a class="chip" href="${href('materials')}#${esc(m)}">${esc(matName(m))}</a>`).join('')}</div>
        <h3 class="h3" style="margin-top:20px;font-size:var(--fs-md)">Climate fit</h3>
        <p class="small" style="margin-top:6px;color:var(--ink-2)">${esc(s.climate)}</p>
        <p class="tiny muted" style="margin-top:20px">${esc(stylesData.note)}</p>`,
      footer: `<a class="btn btn--primary" href="${href('explore', { style: s.id })}">See ${esc(s.name)} designs</a>`,
    });
  }

  scopeEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-scope]');
    if (!b) return;
    scope = b.dataset.scope;
    scopeEl.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  });
  listEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-detail]');
    if (b) detail(b.dataset.detail);
  });
  render();
  if (location.hash && styles.some((s) => s.id === location.hash.slice(1))) {
    document.getElementById(location.hash.slice(1))?.scrollIntoView();
    detail(location.hash.slice(1));
  }
});
