/**
 * First-launch onboarding: four swipeable screens with a progress bar.
 * Skippable at any point, replayable from Settings. The last screen collects
 * optional preferences; nothing is required and nothing leaves the device.
 */
import { store } from '../storage/store.js';
import { esc } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { asset } from '../navigation.js';
import { brandName } from '../config.js';
import { categories, styles } from '../services/catalog.js';
import { toast } from './toast.js';

const SLIDES = [
  { art: 'assets/illustrations/designs/athangudi-floored-drawing-room-1.svg', alt: 'Illustration of a drawing room with a patterned Athangudi floor', title: () => `Welcome to ${brandName()}`, text: 'Interior ideas made for Indian homes, climates and budgets — from compact city flats to heritage houses.' },
  { art: 'assets/illustrations/designs/teak-mandir-with-brass-bells-1.svg', alt: 'Illustration of a teak pooja mandir with brass bells', title: () => 'Discover beautiful Indian spaces', text: 'Browse living rooms, modular kitchens, pooja rooms, balconies and businesses, in regional and contemporary styles.' },
  { art: 'assets/illustrations/designs/haveli-guest-suite-2.svg', alt: 'Illustration of material swatches and a brass vase', title: () => 'Styles, budgets and practical guidance', text: 'Compare materials, plan an indicative budget in rupees and see which standards apply — with honest notes on what needs a professional.' },
];

export const INTERESTS = [
  { id: 'living-room', label: 'Living rooms' },
  { id: 'modular-kitchen', label: 'Kitchens' },
  { id: 'master-bedroom', label: 'Bedrooms' },
  { id: 'pooja-room', label: 'Pooja rooms' },
  { id: 'bathroom', label: 'Bathrooms' },
  { id: 'home-office', label: 'Work from home' },
  { id: 'balcony', label: 'Balconies' },
  { id: 'office', label: 'Commercial' },
];

export function preferenceFields(prefs, idp = 'ob') {
  const opt = (v, label, cur) => `<option value="${esc(v)}" ${cur === v ? 'selected' : ''}>${esc(label)}</option>`;
  const radio = (name, v, label, cur) =>
    `<input type="radio" id="${idp}-${name}-${v}" name="${name}" value="${esc(v)}" ${cur === v ? 'checked' : ''}><label for="${idp}-${name}-${v}">${esc(label)}</label>`;
  return `
    <div class="field"><label for="${idp}-city">City</label>
      <select class="select" id="${idp}-city" name="city">${opt('', 'Choose a city (optional)', prefs.city)}${categories.cities.map((c) => opt(c.id, c.name, prefs.city)).join('')}</select></div>
    <fieldset class="field"><legend>Home type</legend><div class="option-grid">
      ${radio('propertyType', 'apartment', 'Apartment', prefs.propertyType)}${radio('propertyType', 'independent-house', 'Independent home', prefs.propertyType)}${radio('propertyType', 'villa', 'Villa', prefs.propertyType)}
    </div></fieldset>
    <fieldset class="field"><legend>Bedrooms</legend><div class="option-grid">
      ${['1', '2', '3', '4+'].map((b) => radio('bedrooms', b, b === '4+' ? '4 or more' : `${b} BHK`, prefs.bedrooms)).join('')}
    </div></fieldset>
    <div class="field"><label for="${idp}-style">Preferred style</label>
      <select class="select" id="${idp}-style" name="style">${opt('', 'No preference', prefs.style)}${styles.map((s) => opt(s.id, s.name, prefs.style)).join('')}</select></div>
    <fieldset class="field"><legend>Approximate budget</legend><div class="option-grid">
      ${categories.budgetTiers.map((t) => radio('budget', t.id, `${t.name} ${t.short}`, prefs.budget)).join('')}
    </div></fieldset>
    <fieldset class="field"><legend>Areas of interest</legend><div class="option-grid">
      ${INTERESTS.map((i) => `<input type="checkbox" id="${idp}-int-${i.id}" name="interests" value="${i.id}" ${prefs.interests?.includes(i.id) ? 'checked' : ''}><label for="${idp}-int-${i.id}">${esc(i.label)}</label>`).join('')}
    </div></fieldset>`;
}

export function readPreferenceForm(form) {
  const fd = new FormData(form);
  return {
    city: fd.get('city') || '',
    propertyType: fd.get('propertyType') || '',
    bedrooms: fd.get('bedrooms') || '',
    style: fd.get('style') || '',
    budget: fd.get('budget') || '',
    interests: fd.getAll('interests'),
  };
}

export function shouldShowOnboarding() {
  const s = store.get();
  if (s.onboarding.done) return false;
  if (new URLSearchParams(location.search).has('noonboarding')) return false;
  return true;
}

export function openOnboarding({ onDone } = {}) {
  const prefs = store.get().prefs;
  const total = SLIDES.length + 1;
  const el = document.createElement('div');
  el.className = 'onboarding';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Welcome tour');
  el.innerHTML = `
    <div class="onboarding__top">
      <div class="progress" role="progressbar" aria-label="Tour progress" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="1"><span style="--value:${1 / total}"></span></div>
      <button type="button" class="btn btn--ghost btn--sm" data-skip>Skip</button>
    </div>
    <div class="onboarding__slides" tabindex="-1">
      ${SLIDES.map(
        (s, i) => `<section class="onboarding__slide" aria-roledescription="slide" aria-label="${i + 1} of ${total}"><div class="onboarding__art"><img src="${esc(asset(s.art))}" alt="${esc(s.alt)}" width="1200" height="900"></div><div class="wrap"><p class="eyebrow">${i + 1} / ${total}</p><h2>${esc(s.title())}</h2><p class="lede">${esc(s.text)}</p></div></section>`,
      ).join('')}
      <section class="onboarding__slide" aria-roledescription="slide" aria-label="${total} of ${total}">
        <div class="wrap">
          <p class="eyebrow">${total} / ${total}</p>
          <h2>Personalise your experience</h2>
          <p class="lede" style="margin-bottom:24px">All optional. Your answers stay on this device and shape what you see first.</p>
          <form id="ob-form">${preferenceFields(prefs)}</form>
        </div>
      </section>
    </div>
    <div class="onboarding__foot">
      <button type="button" class="btn" data-prev>${icon('chevron-left')} Back</button>
      <button type="button" class="btn btn--primary" data-next>Next ${icon('chevron-right')}</button>
    </div>`;
  document.body.appendChild(el);
  document.documentElement.style.overflow = 'hidden';
  const track = el.querySelector('.onboarding__slides');
  const bar = el.querySelector('.progress');
  const prev = el.querySelector('[data-prev]');
  const next = el.querySelector('[data-next]');
  let index = 0;

  const go = (i) => {
    index = Math.max(0, Math.min(total - 1, i));
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
    sync();
  };
  const sync = () => {
    bar.setAttribute('aria-valuenow', index + 1);
    bar.querySelector('span').style.setProperty('--value', (index + 1) / total);
    prev.disabled = index === 0;
    prev.style.visibility = index === 0 ? 'hidden' : 'visible';
    next.innerHTML = index === total - 1 ? `${icon('check')} Start exploring` : `Next ${icon('chevron-right')}`;
  };
  track.addEventListener(
    'scroll',
    () => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== index) {
        index = i;
        sync();
      }
    },
    { passive: true },
  );

  const finish = (save) => {
    const values = save ? readPreferenceForm(el.querySelector('#ob-form')) : {};
    store.update((s) => {
      s.onboarding = { done: true, at: new Date().toISOString() };
      if (save) {
        s.prefs = { ...s.prefs, ...values };
        if (values.city) s.budgetDraft = { ...(s.budgetDraft || {}), city: values.city };
      }
    });
    el.remove();
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    if (save) toast('Preferences saved', { kind: 'good', body: 'Change them any time in Settings.' });
    onDone?.(save);
  };

  prev.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => (index === total - 1 ? finish(true) : go(index + 1)));
  el.querySelector('[data-skip]').addEventListener('click', () => finish(false));
  const onKey = (e) => {
    if (e.target.closest('select, input')) return;
    if (e.key === 'ArrowRight') go(index + 1);
    if (e.key === 'ArrowLeft') go(index - 1);
    if (e.key === 'Escape') finish(false);
  };
  document.addEventListener('keydown', onKey);
  sync();
  next.focus();
}
