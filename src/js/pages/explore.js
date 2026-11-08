import { bootPage } from '../app.js';
import {
  loadDesigns, loadMaterials, filterDesigns, sortDesigns, paginate, SORTS, FILTER_KEYS, nameOf, groups, categories,
  styles, countActiveFilters, filtersFromParams, resetCache,
} from '../services/catalog.js';
import { designCard, bindDesignCards } from '../components/designCard.js';
import { skeletonCards } from '../components/media.js';
import { createInfiniteList } from '../interactions/infinite.js';
import { initPullToRefresh } from '../interactions/pullToRefresh.js';
import { openSheet } from '../components/sheet.js';
import { openMenu } from '../components/popover.js';
import { toast } from '../components/toast.js';
import { withBusy } from '../interactions/press.js';
import { revealIn } from '../interactions/motion.js';
import { debounce, esc, updateQuery, announce } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { t } from '../i18n.js';

const SCOPES = [
  { id: 'all', label: 'All' },
  { id: 'residential', label: 'Homes' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'regional', label: 'Regional styles' },
];

bootPage({ page: 'explore' }, async (ctx) => {
  const results = document.getElementById('results');
  const footer = document.getElementById('results-footer');
  const countEl = document.getElementById('count');
  const qInput = document.getElementById('q');
  const qClear = document.getElementById('q-clear');
  const sortBtn = document.getElementById('sort');
  const scopeEl = document.getElementById('scope');
  const chipsEl = document.getElementById('chips');

  results.innerHTML = skeletonCards(6);
  let designs = await loadDesigns();
  const materials = (await loadMaterials()).materials;
  const byId = (id) => designs.find((d) => d.id === id);
  const state = filtersFromParams(ctx.params);
  let current = [];

  const options = {
    category: [...groups.find((g) => g.id === 'rooms').items, ...groups.find((g) => g.id === 'commercial').items].map((i) => ({ id: i.id, label: i.name })),
    element: groups.find((g) => g.id === 'elements').items.map((i) => ({ id: i.id, label: i.name })),
    style: styles.map((s) => ({ id: s.id, label: s.name })),
    city: categories.cities.map((c) => ({ id: c.id, label: c.name })),
    climate: categories.climates.map((c) => ({ id: c.id, label: c.name })),
    budget: categories.budgetTiers.map((b) => ({ id: b.id, label: `${b.name} ${b.short}` })),
    property: groups.find((g) => g.id === 'property').items.map((i) => ({ id: i.id, label: i.name })),
    material: materials.map((m) => ({ id: m.id, label: m.name })),
  };
  const LABELS = { category: 'Room or space', element: 'Interior element', style: 'Design style', city: 'City', climate: 'Climate', budget: 'Budget', property: 'Property type', material: 'Material' };

  qInput.value = state.q;
  qClear.hidden = !state.q;

  const list = createInfiniteList({
    container: results,
    footer,
    loadPage: async (page) => paginate(current, page, 12),
    renderItems: (items) => {
      results.insertAdjacentHTML('beforeend', items.map((d) => designCard(d)).join(''));
      bindDesignCards(results, byId);
      revealIn(results.parentElement);
    },
    onEmpty: () => {
      results.innerHTML = `<div class="state" style="grid-column:1/-1">${icon('search', { cls: 'state__icon' })}<h2>No designs match</h2><p>Try fewer filters or a different word — for example “kitchen”, “Kerala” or “Pune”.</p><div class="cluster"><button type="button" class="btn" data-clear-all>${esc(t('common.clearAll'))}</button></div></div>`;
      results.querySelector('[data-clear-all]').addEventListener('click', clearAll);
    },
    endLabel: (n) => t('common.endOfResults', { count: n }),
  });

  function run({ announceCount = true } = {}) {
    current = sortDesigns(filterDesigns(designs, state), state.sort);
    const n = current.length;
    countEl.textContent = n === 1 ? t('common.result') : t('common.results', { count: n });
    if (announceCount) announce(countEl.textContent);
    updateQuery({ q: state.q, scope: state.scope === 'all' ? '' : state.scope, sort: state.sort === 'relevance' ? '' : state.sort, ...Object.fromEntries(FILTER_KEYS.map((k) => [k, state[k]])) });
    renderScope();
    renderChips();
    sortBtn.querySelector('span').textContent = SORTS.find((s) => s.id === state.sort)?.name || 'Best match';
    return list.reset();
  }

  function renderScope() {
    scopeEl.innerHTML = SCOPES.map((s) => `<button type="button" data-scope="${s.id}" aria-pressed="${state.scope === s.id}">${esc(s.label)}</button>`).join('');
  }
  scopeEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-scope]');
    if (!b) return;
    state.scope = b.dataset.scope;
    run();
  });

  function renderChips() {
    const n = countActiveFilters(state);
    const active = FILTER_KEYS.flatMap((k) => state[k].map((v) => ({ k, v })));
    chipsEl.innerHTML =
      `<button type="button" class="chip ${n ? 'is-active' : ''}" id="open-filters" aria-haspopup="dialog">${icon('filters')} Filters${n ? ` <span class="chip__count">${n}</span>` : ''}</button>` +
      active.map(({ k, v }) => `<button type="button" class="chip" data-remove="${k}:${esc(v)}" aria-label="Remove filter ${esc(nameOf(v))}">${esc(k === 'material' ? options.material.find((m) => m.id === v)?.label || v : nameOf(v))} ${icon('x')}</button>`).join('') +
      (n ? `<button type="button" class="chip" data-clear-all>${esc(t('common.clearAll'))}</button>` : '') +
      (!n ? ['living-room', 'modular-kitchen', 'pooja-room', 'master-bedroom', 'balcony', 'bathroom'].map((c) => `<button type="button" class="chip" data-quick="${c}">${esc(nameOf(c))}</button>`).join('') : '');
  }
  chipsEl.addEventListener('click', (e) => {
    if (e.target.closest('#open-filters')) return openFilters();
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      const [k, v] = rm.dataset.remove.split(':');
      state[k] = state[k].filter((x) => x !== v);
      return run();
    }
    const q = e.target.closest('[data-quick]');
    if (q) {
      state.category = [q.dataset.quick];
      return run();
    }
    if (e.target.closest('[data-clear-all]')) clearAll();
  });

  function clearAll() {
    FILTER_KEYS.forEach((k) => (state[k] = []));
    state.q = '';
    state.scope = 'all';
    qInput.value = '';
    qClear.hidden = true;
    run();
  }

  // Filters bottom sheet: live counts, apply on close
  function openFilters() {
    const draft = Object.fromEntries(FILTER_KEYS.map((k) => [k, [...state[k]]]));
    const countFor = () => filterDesigns(designs, { ...state, ...draft }).length;
    const body = FILTER_KEYS.map(
      (k) => `<details class="disclosure" ${draft[k].length ? 'open' : ''}><summary>${esc(LABELS[k])}<span class="badge" data-n="${k}" ${draft[k].length ? '' : 'hidden'}>${draft[k].length}</span></summary><div class="disclosure__body"><div class="option-grid">${options[k]
        .map((o) => `<input type="checkbox" id="f-${k}-${esc(o.id)}" data-k="${k}" value="${esc(o.id)}" ${draft[k].includes(o.id) ? 'checked' : ''}><label for="f-${k}-${esc(o.id)}">${esc(o.label)}</label>`)
        .join('')}</div></div></details>`,
    ).join('');
    let applied = false;
    const sheet = openSheet({
      title: 'Filters',
      body: `<p class="tiny muted" style="margin-bottom:8px">${esc(categories.climateNote)}</p>${body}`,
      footer: `<button type="button" class="btn" data-reset>${esc(t('common.clearAll'))}</button><button type="button" class="btn btn--primary" data-apply>${esc(t('common.apply', { count: countFor() }))}</button>`,
      onClose: () => {
        if (!applied) return;
        FILTER_KEYS.forEach((k) => (state[k] = draft[k]));
        run();
      },
    });
    const applyBtn = sheet.el.querySelector('[data-apply]');
    const refreshCount = () => {
      const n = countFor();
      applyBtn.textContent = n ? t('common.apply', { count: n }) : 'No matches';
      FILTER_KEYS.forEach((k) => {
        const b = sheet.el.querySelector(`[data-n="${k}"]`);
        b.textContent = draft[k].length;
        b.hidden = !draft[k].length;
      });
    };
    sheet.el.addEventListener('change', (e) => {
      const cb = e.target.closest('[data-k]');
      if (!cb) return;
      const k = cb.dataset.k;
      draft[k] = cb.checked ? [...draft[k], cb.value] : draft[k].filter((x) => x !== cb.value);
      refreshCount();
    });
    sheet.el.querySelector('[data-reset]').addEventListener('click', () => {
      FILTER_KEYS.forEach((k) => (draft[k] = []));
      sheet.el.querySelectorAll('[data-k]').forEach((cb) => (cb.checked = false));
      refreshCount();
    });
    applyBtn.addEventListener('click', () => {
      applied = true;
      sheet.close('apply');
    });
  }

  // Search (instant, debounced)
  const onSearch = debounce(() => {
    state.q = qInput.value.trim();
    qClear.hidden = !state.q;
    run();
  }, 160);
  qInput.addEventListener('input', onSearch);
  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    qInput.blur();
  });
  qClear.addEventListener('click', () => {
    qInput.value = '';
    qClear.hidden = true;
    state.q = '';
    run();
    qInput.focus();
  });

  // Sort pull-down menu
  sortBtn.addEventListener('click', async () => {
    const id = await openMenu(sortBtn, { options: SORTS.map((s) => ({ id: s.id, label: s.name })), selected: state.sort, label: 'Sort designs' });
    if (id && id !== state.sort) {
      state.sort = id;
      run();
    }
  });

  // Refresh: reload the catalogue data (not the whole page), with feedback
  const refreshBtn = document.getElementById('refresh');
  async function refresh() {
    try {
      resetCache();
      designs = await loadDesigns();
      await run({ announceCount: false });
      window.scrollTo({ top: 0 });
      toast(t('toast.refreshed'), { kind: 'good', body: t('common.results', { count: current.length }) });
    } catch (err) {
      console.error(err);
      toast(t('toast.refreshFailed'), { kind: 'bad', body: navigator.onLine ? 'Something went wrong loading designs.' : 'You appear to be offline.', action: { label: t('toast.retry'), fn: refresh } });
    }
  }
  refreshBtn.addEventListener('click', () => withBusy(refreshBtn, refresh));
  initPullToRefresh(refresh);

  window.addEventListener('popstate', () => location.reload());
  await run({ announceCount: false });
});
