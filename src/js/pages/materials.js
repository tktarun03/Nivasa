import { bootPage } from '../app.js';
import { loadMaterials, tierById } from '../services/catalog.js';
import standardsData from '../../data/standards.json';
import { openSheet } from '../components/sheet.js';
import { toast } from '../components/toast.js';
import { initAlphaIndex } from '../interactions/alphaIndex.js';
import { href } from '../navigation.js';
import { esc, debounce, announce } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { statusBadge } from './standards-shared.js';

const MAX_COMPARE = 3;

bootPage({ page: 'materials' }, async () => {
  const data = await loadMaterials();
  const { groups: mGroups, materials } = data;
  const stdById = Object.fromEntries(standardsData.documents.map((d) => [d.id, d]));
  const listEl = document.getElementById('m-list');
  const groupsEl = document.getElementById('m-groups');
  const tray = document.getElementById('compare-tray');
  document.getElementById('m-note').innerHTML = `${icon('info')}<span>${esc(data.note)}</span>`;
  let group = 'all';
  let q = '';
  const compare = new Set();
  let alpha = null;

  groupsEl.innerHTML = [{ id: 'all', name: 'All' }, ...mGroups].map((g) => `<button type="button" class="chip" data-group="${g.id}" aria-pressed="${g.id === 'all'}">${esc(g.name)}</button>`).join('');

  function visible() {
    const needle = q.toLowerCase();
    return materials
      .filter((m) => group === 'all' || m.group === group)
      .filter((m) => !needle || `${m.name} ${m.description} ${m.uses.join(' ')}`.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function render() {
    const list = visible();
    announce(`${list.length} materials`);
    if (!list.length) {
      listEl.innerHTML = `<div class="state">${icon('layers', { cls: 'state__icon' })}<h2>No materials match</h2><p>Try “tile”, “stone” or “plywood”.</p></div>`;
      alpha?.remove();
      alpha = null;
      return;
    }
    const byLetter = {};
    list.forEach((m) => (byLetter[m.name[0].toUpperCase()] ||= []).push(m));
    listEl.innerHTML = Object.entries(byLetter)
      .map(
        ([L, ms]) => `<section aria-labelledby="L-${L}" data-letter-section="${L}"><h2 class="alpha-head" id="L-${L}">${L}</h2>
          <ul class="list-grid" role="list" style="list-style:none;padding:0;margin:12px 0 24px">${ms
            .map(
              (m) => `<li id="${esc(m.id)}" class="card" style="padding:16px">
                <div style="display:flex;gap:12px;align-items:flex-start">
                  <div style="flex:1"><h3 class="h3" style="font-size:var(--fs-md)">${esc(m.name)}</h3>
                  <p class="tiny muted">${esc(mGroups.find((g) => g.id === m.group)?.name)} · ${esc(tierById[m.cost]?.name)} ${esc(tierById[m.cost]?.short)}</p></div>
                  <button type="button" class="chip" data-compare="${esc(m.id)}" aria-pressed="${compare.has(m.id)}" aria-label="Compare ${esc(m.name)}">${icon(compare.has(m.id) ? 'check' : 'plus')} Compare</button>
                </div>
                <p class="small" style="margin-top:8px;color:var(--ink-2)">${esc(m.description)}</p>
                <div class="cluster" style="margin-top:12px">${m.standards.length ? m.standards.map((s) => `<span class="badge">${esc(stdById[s]?.designation || s)}</span>`).join('') : '<span class="badge badge--demo">No standard listed</span>'}<button type="button" class="btn btn--sm btn--ghost" data-open="${esc(m.id)}" style="margin-left:auto">Details ${icon('chevron-right')}</button></div>
              </li>`,
            )
            .join('')}</ul></section>`,
      )
      .join('');
    const sections = Object.fromEntries([...listEl.querySelectorAll('[data-letter-section]')].map((s) => [s.dataset.letterSection, s]));
    alpha?.remove();
    alpha = initAlphaIndex({ sections });
    document.body.classList.add('has-alpha-index');
  }

  function openDetail(id) {
    const m = materials.find((x) => x.id === id);
    if (!m) return;
    const stds = m.standards.map((s) => stdById[s]).filter(Boolean);
    openSheet({
      title: m.name,
      body: `<p class="small" style="color:var(--ink-2)">${esc(m.description)}</p>
        <h3 class="h3" style="margin-top:20px;font-size:var(--fs-md)">Good for</h3>
        <ul class="small" style="padding-left:1.1em;margin:8px 0 0;color:var(--ink-2)">${m.uses.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>
        <div class="pros-cons" style="margin-top:20px"><div><h3 class="h3" style="font-size:var(--fs-md)">Advantages</h3><ul>${m.pros.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div><div><h3 class="h3" style="font-size:var(--fs-md)">Limitations</h3><ul>${m.cons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
        <h3 class="h3" style="margin-top:20px;font-size:var(--fs-md)">Care and maintenance</h3><p class="small" style="margin-top:6px;color:var(--ink-2)">${esc(m.maintenance)}</p>
        <h3 class="h3" style="margin-top:20px;font-size:var(--fs-md)">Relevant standards</h3>
        ${
          stds.length
            ? `<ul class="action-list" role="list">${stds.map((s) => `<li><a href="${href('standards')}#${esc(s.id)}">${icon('shield')}<span style="flex:1">${esc(s.designation)}<span class="tiny muted" style="display:block">${esc(s.title)}</span></span>${statusBadge(s.reviewStatus)}</a></li>`).join('')}</ul>`
            : `<p class="small muted" style="margin-top:6px">${esc(m.standardsNote || 'No specific standard is listed in this catalogue. Ask your supplier which standards and certifications apply.')}</p>`
        }
        ${m.standardsNote && stds.length ? `<p class="tiny muted" style="margin-top:8px">${esc(m.standardsNote)}</p>` : ''}`,
    });
  }

  function renderTray() {
    const n = compare.size;
    tray.hidden = n === 0;
    tray.innerHTML = `<div style="flex:1"><p class="small"><strong>${n}</strong> of ${MAX_COMPARE} selected</p><p class="tiny muted">${[...compare].map((id) => esc(materials.find((m) => m.id === id).name)).join(' · ')}</p></div>
      <button type="button" class="btn btn--sm btn--ghost" data-clear-compare>Clear</button><button type="button" class="btn btn--sm btn--primary" data-do-compare ${n < 2 ? 'disabled' : ''}>Compare</button>`;
  }

  function openCompare() {
    const ms = [...compare].map((id) => materials.find((m) => m.id === id));
    const row = (label, fn) => `<tr><th scope="row">${label}</th>${ms.map((m) => `<td>${fn(m)}</td>`).join('')}</tr>`;
    openSheet({
      title: 'Compare materials',
      body: `<div class="table-scroll"><table class="compare-table"><thead><tr><th scope="col"><span class="sr-only">Property</span></th>${ms.map((m) => `<th scope="col">${esc(m.name)}</th>`).join('')}</tr></thead><tbody>
        ${row('Cost level', (m) => `${esc(tierById[m.cost]?.name)} ${esc(tierById[m.cost]?.short)}`)}
        ${row('Good for', (m) => esc(m.uses.join('; ')))}
        ${row('Advantages', (m) => esc(m.pros.join('; ')))}
        ${row('Limitations', (m) => esc(m.cons.join('; ')))}
        ${row('Care', (m) => esc(m.maintenance))}
        ${row('Standards', (m) => (m.standards.length ? m.standards.map((s) => esc(stdById[s]?.designation || s)).join(', ') : '—'))}
      </tbody></table></div>`,
    });
  }

  groupsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-group]');
    if (!b) return;
    group = b.dataset.group;
    groupsEl.querySelectorAll('[data-group]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  });
  document.getElementById('m-q').addEventListener('input', debounce((e) => ((q = e.target.value.trim()), render()), 150));
  listEl.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]');
    if (o) return openDetail(o.dataset.open);
    const c = e.target.closest('[data-compare]');
    if (c) {
      const id = c.dataset.compare;
      if (compare.has(id)) compare.delete(id);
      else if (compare.size >= MAX_COMPARE) return toast(`Compare up to ${MAX_COMPARE}`, { body: 'Remove one to add another.' });
      else compare.add(id);
      c.setAttribute('aria-pressed', String(compare.has(id)));
      c.innerHTML = `${icon(compare.has(id) ? 'check' : 'plus')} Compare`;
      renderTray();
    }
  });
  tray.addEventListener('click', (e) => {
    if (e.target.closest('[data-clear-compare]')) {
      compare.clear();
      render();
      renderTray();
    }
    if (e.target.closest('[data-do-compare]')) openCompare();
  });

  render();
  renderTray();
  if (location.hash) {
    const id = location.hash.slice(1);
    if (materials.some((m) => m.id === id)) {
      document.getElementById(id)?.scrollIntoView();
      openDetail(id);
    }
  }
});
