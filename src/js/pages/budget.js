import { bootPage } from '../app.js';
import { categories, groups, nameOf } from '../services/catalog.js';
import {
  estimate, formatINR, formatRange, FINISH_LEVELS, WORK_CATEGORIES, DEFAULT_AREAS, PROPERTY_FACTORS, ASSUMPTIONS,
  INCLUSIONS, EXCLUSIONS, MODEL_REVIEWED, sqftToSqm, sqmToSqft,
} from '../services/budgetModel.js';
import { store } from '../storage/store.js';
import { esc, debounce, formatDate } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { toast } from '../components/toast.js';

const STEPS = ['Location', 'Rooms', 'Finish', 'Work'];

bootPage({ page: 'budget' }, async (ctx) => {
  const prefs = store.get().prefs;
  const saved = store.get().budgetDraft || {};
  const p = ctx.params;
  const state = {
    step: 0,
    city: p.get('city') || saved.city || prefs.city || 'mumbai',
    property: saved.property || '2bhk',
    finish: p.get('finish') || saved.finish || prefs.budget || 'comfort',
    rooms: p.get('room')
      ? [{ type: p.get('room'), areaSqft: Number(p.get('area')) || DEFAULT_AREAS[p.get('room')] || 150 }]
      : saved.rooms?.length
        ? saved.rooms
        : [{ type: 'living-room', areaSqft: DEFAULT_AREAS['living-room'] }, { type: 'modular-kitchen', areaSqft: DEFAULT_AREAS['modular-kitchen'] }],
    works: saved.works || WORK_CATEGORIES.map((w) => w.id),
    contingency: saved.contingency ?? true,
    units: prefs.units || 'sqft',
  };
  if (p.get('room')) state.step = 1;

  const stepsEl = document.getElementById('budget-steps');
  const body = document.getElementById('budget-step-body');
  const resultEl = document.getElementById('budget-result');
  const accessory = document.getElementById('budget-accessory');
  const prevBtn = document.getElementById('b-prev');
  const nextBtn = document.getElementById('b-next');
  const roomOptions = [...groups.find((g) => g.id === 'rooms').items, ...groups.find((g) => g.id === 'commercial').items];
  const propertyOptions = groups.find((g) => g.id === 'property').items.filter((i) => PROPERTY_FACTORS[i.id] !== undefined);

  const persist = debounce(() => {
    store.update((s) => {
      s.budgetDraft = { city: state.city, property: state.property, finish: state.finish, rooms: state.rooms, works: state.works, contingency: state.contingency };
      if (state.rooms.length) s.budgetUsed = true;
    });
  }, 400);

  const toDisplay = (sqft) => (state.units === 'sqm' ? Math.round(sqftToSqm(sqft) * 10) / 10 : Math.round(sqft));
  const fromDisplay = (v) => (state.units === 'sqm' ? sqmToSqft(Number(v)) : Number(v));
  const unitLabel = () => (state.units === 'sqm' ? 'm²' : 'sq ft');

  function renderSteps() {
    stepsEl.innerHTML = STEPS.map((s, i) => `<li ${i === state.step ? 'aria-current="step"' : ''} data-state="${i < state.step ? 'done' : ''}">${i + 1}. ${esc(s)}</li>`).join('');
    prevBtn.style.visibility = state.step === 0 ? 'hidden' : 'visible';
    nextBtn.innerHTML = state.step === STEPS.length - 1 ? `${icon('check')} See summary` : `Next ${icon('chevron-right')}`;
  }

  function renderBody() {
    if (state.step === 0) {
      body.innerHTML = `
        <div class="field"><label for="b-city">City</label>
          <select class="select" id="b-city">${categories.cities.map((c) => `<option value="${c.id}" ${c.id === state.city ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
          <span class="hint">Applies an approximate relative city factor.</span></div>
        <div class="field"><label for="b-property">Property type</label>
          <select class="select" id="b-property">${propertyOptions.map((c) => `<option value="${c.id}" ${c.id === state.property ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>`;
    } else if (state.step === 1) {
      body.innerHTML = `
        <div class="section-head" style="margin-bottom:12px"><h2 class="h3">Rooms and areas</h2>
          <div class="scope-bar" role="group" aria-label="Area units"><button type="button" data-units="sqft" aria-pressed="${state.units === 'sqft'}">sq ft</button><button type="button" data-units="sqm" aria-pressed="${state.units === 'sqm'}">m²</button></div></div>
        <ul class="action-list" role="list" id="room-list">${state.rooms
          .map(
            (r, i) => `<li style="display:flex;gap:8px;align-items:center;padding:8px 0">
              <span style="flex:1;font-size:var(--fs-sm)">${esc(nameOf(r.type))}</span>
              <label class="sr-only" for="area-${i}">Area of ${esc(nameOf(r.type))} in ${unitLabel()}</label>
              <input class="input num" id="area-${i}" data-area="${i}" type="number" inputmode="decimal" min="1" max="20000" step="1" value="${toDisplay(r.areaSqft)}" style="width:110px">
              <span class="tiny muted" style="width:36px">${unitLabel()}</span>
              <button type="button" class="icon-btn" data-remove-room="${i}" aria-label="Remove ${esc(nameOf(r.type))}">${icon('trash')}</button></li>`,
          )
          .join('')}</ul>
        ${state.rooms.length ? '' : '<p class="small muted">Add at least one room to see an estimate.</p>'}
        <div class="input-group" style="margin-top:16px">
          <label class="sr-only" for="add-room">Room to add</label>
          <select class="select" id="add-room">${roomOptions.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select>
          <button type="button" class="btn" id="add-room-btn">${icon('plus')} Add</button>
        </div>
        <p class="hint tiny muted" style="margin-top:8px">Default areas are typical starting points for estimating only — measure your own rooms.</p>`;
    } else if (state.step === 2) {
      body.innerHTML = `<fieldset class="field"><legend>Finish level</legend><div class="list-grid" style="grid-template-columns:1fr">${FINISH_LEVELS.map(
        (f) => `<label class="cat-tile" style="cursor:pointer"><input type="radio" name="finish" value="${f.id}" ${f.id === state.finish ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--accent)"><span><span class="cat-tile__name">${esc(f.name)}</span><span class="cat-tile__count" style="display:block">${esc(f.description)} · ${formatINR(f.rate[0])}–${formatINR(f.rate[1])} per sq ft base</span></span></label>`,
      ).join('')}</div></fieldset>`;
    } else {
      body.innerHTML = `<fieldset class="field"><legend>Work to include</legend><div class="option-grid">${WORK_CATEGORIES.map(
        (w) => `<input type="checkbox" id="w-${w.id}" value="${w.id}" data-work ${state.works.includes(w.id) ? 'checked' : ''}><label for="w-${w.id}">${esc(w.name)}</label>`,
      ).join('')}</div></fieldset>
      <div class="switch-row" style="margin-top:16px"><label class="switch-text" for="contingency">Add 10% contingency<span>Covers surprises found once work starts.</span></label><input type="checkbox" class="switch" id="contingency" ${state.contingency ? 'checked' : ''}></div>`;
    }
  }

  function completeness() {
    let n = 0;
    if (state.city) n++;
    if (state.property) n++;
    if (state.rooms.length && state.rooms.every((r) => r.areaSqft > 0)) n++;
    if (state.finish) n++;
    if (state.works.length) n++;
    return n / 5;
  }

  function renderResult() {
    const est = estimate(state);
    const c = completeness();
    const C = 2 * Math.PI * 26;
    const max = Math.max(1, ...est.breakdown.map((b) => b.high));
    const hasResult = est.high > 0;
    resultEl.innerHTML = `
      <div style="display:flex;gap:16px;align-items:center">
        <div class="ring" role="img" aria-label="Planner ${Math.round(c * 100)}% complete"><svg viewBox="0 0 64 64"><circle class="ring__track" cx="32" cy="32" r="26"/><circle class="ring__value" cx="32" cy="32" r="26" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - c)}"/></svg><span class="ring__label">${Math.round(c * 100)}%</span></div>
        <div><p class="eyebrow" id="result-title">Indicative range</p><p class="budget-range num" aria-live="polite">${hasResult ? formatRange(est.low, est.high) : '—'}</p></div>
      </div>
      ${
        hasResult
          ? `<p class="small muted num">${formatINR(est.perSqft[0])}–${formatINR(est.perSqft[1])} per sq ft across ${est.totalArea} sq ft${est.contingency ? ', including 10% contingency' : ''}.</p>
      <ul class="bar-list" aria-label="Breakdown by work category">${est.breakdown.map((b) => `<li><div class="bar-row"><span>${esc(b.name)}</span><span class="num muted">${formatRange(b.low, b.high)}</span></div><div class="bar"><span style="--w:${(b.high / max).toFixed(3)}"></span></div></li>`).join('')}</ul>
      <details class="disclosure"><summary>By room</summary><div class="disclosure__body"><dl class="spec-list">${est.rooms.map((r) => `<dt>${esc(nameOf(r.type))} · ${r.areaSqft} sq ft</dt><dd class="num">${formatRange(r.low, r.high)}</dd>`).join('')}</dl></div></details>`
          : '<p class="small muted">Add rooms and choose at least one work category to see a range.</p>'
      }
      <details class="disclosure"><summary>Assumptions</summary><div class="disclosure__body prose small"><ul>${ASSUMPTIONS.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div></details>
      <details class="disclosure"><summary>Included and excluded</summary><div class="disclosure__body prose small"><p><strong>Included</strong></p><ul>${INCLUSIONS.map((a) => `<li>${esc(a)}</li>`).join('')}</ul><p><strong>Not included</strong></p><ul>${EXCLUSIONS.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div></details>
      <p class="callout"><span>${icon('info')}</span><span>Illustrative model rates, last reviewed ${esc(formatDate(MODEL_REVIEWED))}. These are <strong>not market quotations</strong>. Get itemised quotes from at least two local contractors.</span></p>
      <div class="cluster"><button type="button" class="btn btn--sm" id="print">${icon('download')} Print or save as PDF</button><button type="button" class="btn btn--sm btn--ghost" id="reset">${icon('reset')} Start over</button></div>`;
    accessory.hidden = !hasResult || resultInView || window.matchMedia('(min-width: 900px)').matches;
    lastHasResult = hasResult;
    accessory.setAttribute('aria-hidden', String(accessory.hidden));
    accessory.innerHTML = `<div style="flex:1"><p class="tiny muted">Indicative range</p><p class="num" style="font-weight:500">${formatRange(est.low, est.high)}</p></div><a class="btn btn--sm" href="#budget-result">Details</a>`;
    resultEl.querySelector('#print').addEventListener('click', () => window.print());
    resultEl.querySelector('#reset').addEventListener('click', () => {
      const prev = structuredClone(state);
      Object.assign(state, { step: 0, rooms: [], works: WORK_CATEGORIES.map((w) => w.id), contingency: true, finish: 'comfort' });
      update();
      toast('Planner cleared', { undo: () => (Object.assign(state, prev), update()) });
    });
  }

  // Hide the sticky total while the full result card is on screen
  let resultInView = false;
  let lastHasResult = false;
  new IntersectionObserver((entries) => {
    resultInView = entries[0].isIntersecting;
    accessory.hidden = !lastHasResult || resultInView || window.matchMedia('(min-width: 900px)').matches;
    accessory.setAttribute('aria-hidden', String(accessory.hidden));
  }, { threshold: 0.15 }).observe(resultEl);

  function update({ body: redrawBody = true } = {}) {
    renderSteps();
    if (redrawBody) renderBody();
    renderResult();
    persist();
  }

  body.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'b-city') state.city = t.value;
    else if (t.id === 'b-property') state.property = t.value;
    else if (t.name === 'finish') state.finish = t.value;
    else if (t.dataset.work !== undefined) state.works = [...body.querySelectorAll('[data-work]:checked')].map((x) => x.value);
    else if (t.id === 'contingency') state.contingency = t.checked;
    else return;
    update({ body: false });
  });
  body.addEventListener('input', (e) => {
    const i = e.target.dataset.area;
    if (i === undefined) return;
    const v = fromDisplay(e.target.value);
    if (v > 0) {
      state.rooms[Number(i)].areaSqft = Math.round(v);
      update({ body: false }); // keep focus in the field (BasKar rule: don't re-render live inputs)
    }
  });
  body.addEventListener('click', (e) => {
    const u = e.target.closest('[data-units]');
    if (u) {
      state.units = u.dataset.units;
      store.update((s) => void (s.prefs.units = state.units));
      return update();
    }
    const rm = e.target.closest('[data-remove-room]');
    if (rm) {
      const i = Number(rm.dataset.removeRoom);
      const removed = state.rooms[i];
      state.rooms.splice(i, 1);
      update();
      toast('Room removed', { body: nameOf(removed.type), undo: () => (state.rooms.splice(i, 0, removed), update()) });
      return;
    }
    if (e.target.closest('#add-room-btn')) {
      const type = body.querySelector('#add-room').value;
      state.rooms.push({ type, areaSqft: DEFAULT_AREAS[type] || 120 });
      update();
      body.querySelector(`#area-${state.rooms.length - 1}`)?.focus();
    }
  });
  prevBtn.addEventListener('click', () => {
    state.step = Math.max(0, state.step - 1);
    update();
  });
  nextBtn.addEventListener('click', () => {
    if (state.step === 1 && !state.rooms.length) {
      toast('Add a room first', { kind: 'bad', body: 'Choose at least one room to estimate.' });
      return;
    }
    if (state.step < STEPS.length - 1) {
      state.step += 1;
      update();
      body.querySelector('select, input')?.focus();
    } else {
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      resultEl.setAttribute('tabindex', '-1');
      resultEl.focus({ preventScroll: true });
    }
  });
  update();
});
