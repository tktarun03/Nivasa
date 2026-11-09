/**
 * Page registry, link building and the shared shell: header, adaptive bottom
 * navigation (minimises while scrolling down), "More" sheet and footer.
 * Links are relative to the app root so the build works under any subpath.
 */
import { esc } from './utilities/dom.js';
import { icon } from './utilities/icons.js';
import { t } from './i18n.js';
import { APP_VERSION } from './releases.js';
import { brandName } from './config.js';
import { openSheet } from './components/sheet.js';

export const PAGES = {
  home: { path: 'index.html', label: 'nav.home', icon: 'home' },
  explore: { path: 'pages/explore/index.html', label: 'nav.explore', icon: 'explore' },
  categories: { path: 'pages/categories/index.html', label: 'nav.categories', icon: 'categories' },
  category: { path: 'pages/category/index.html', label: 'nav.categories', icon: 'categories' },
  design: { path: 'pages/design/index.html', label: 'nav.explore', icon: 'explore' },
  collections: { path: 'pages/collections/index.html', label: 'nav.collections', icon: 'images' },
  moodboards: { path: 'pages/moodboards/index.html', label: 'nav.moodboards', icon: 'bookmark' },
  budget: { path: 'pages/budget/index.html', label: 'nav.budget', icon: 'calculator' },
  materials: { path: 'pages/materials/index.html', label: 'nav.materials', icon: 'layers' },
  standards: { path: 'pages/standards/index.html', label: 'nav.standards', icon: 'shield' },
  styles: { path: 'pages/styles/index.html', label: 'nav.styles', icon: 'palette' },
  settings: { path: 'pages/settings/index.html', label: 'nav.settings', icon: 'settings' },
  patterns: { path: 'pages/patterns/index.html', label: 'nav.patterns', icon: 'hand' },
};

/** Which bottom-nav tab is "current" for each page. */
const TAB_FOR = {
  home: 'home', explore: 'explore', design: 'explore', categories: 'categories', category: 'categories',
  moodboards: 'moodboards', collections: 'more', budget: 'more', materials: 'more', standards: 'more',
  styles: 'more', settings: 'more', patterns: 'more',
};

export function rootPath() {
  return document.querySelector('meta[name="app-root"]')?.content ?? './';
}

export function href(page, query) {
  const p = PAGES[page];
  if (!p) return '#';
  const qs = query ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== null)).toString()}` : '';
  return `${rootPath()}${p.path}${qs === '?' ? '' : qs}`;
}

export function asset(path) {
  return `${rootPath()}${path}`;
}

export const brandMark = `<svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--ink)"/><path d="M9 24V14a7 7 0 0 1 14 0v10" fill="none" stroke="var(--bg)" stroke-width="1.8"/><path d="M13 24v-8a3 3 0 0 1 6 0v8" fill="none" stroke="var(--accent)" stroke-width="1.8"/><path d="M7 24h18" stroke="var(--bg)" stroke-width="1.8" stroke-linecap="round"/></svg>`;

export function renderHeader(page, { back } = {}) {
  const header = document.createElement('header');
  header.className = 'app-header';
  const desktop = ['explore', 'categories', 'collections', 'styles', 'materials', 'standards', 'budget', 'moodboards']
    .map((p) => `<a href="${href(p)}" ${TAB_FOR[page] === p || page === p ? 'aria-current="page"' : ''}>${esc(t(p === 'moodboards' ? 'nav.moodboardsLong' : PAGES[p].label))}</a>`)
    .join('');
  const backBtn = back
    ? `<button type="button" class="icon-btn header-back" data-back="${esc(typeof back === 'string' ? back : 'home')}" aria-label="${esc(t('nav.back'))}">${icon('back')}</button>`
    : '';
  header.innerHTML = `
    <div class="container app-header__inner">
      ${backBtn}
      <a class="brand" href="${href('home')}" aria-label="${esc(brandName())} — ${esc(t('nav.home'))}">${brandMark}<span class="brand__name">${esc(brandName())}</span></a>
      <nav class="desktop-nav" aria-label="${esc(t('nav.primary'))}">${desktop}</nav>
      <span class="live-status" id="live-status" data-state="ok" role="status" aria-live="polite"><span class="live-status__text">${esc(t('status.online'))}</span></span>
      <a class="icon-btn" href="${href('settings')}" aria-label="${esc(t('nav.settings'))}" ${page === 'settings' ? 'aria-current="page"' : ''}>${icon('settings')}</a>
    </div>
    <div class="scroll-progress" aria-hidden="true"></div>`;
  header.querySelector('[data-back]')?.addEventListener('click', (e) => {
    // Prefer real history so scroll position and filters come back; fall back to a parent page.
    const sameOrigin = document.referrer && new URL(document.referrer).origin === location.origin;
    if (sameOrigin && history.length > 1) history.back();
    else location.href = href(e.currentTarget.dataset.back);
  });
  return header;
}

export function renderBottomNav(page) {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', t('nav.primary'));
  const tab = TAB_FOR[page];
  const items = [
    ['home', 'nav.home', 'home'],
    ['explore', 'nav.explore', 'explore'],
    ['categories', 'nav.categories', 'categories'],
    ['moodboards', 'nav.moodboards', 'bookmark'],
  ];
  nav.innerHTML = `<ul role="list">${items
    .map(
      ([p, label, ic]) =>
        `<li><a href="${href(p)}" ${tab === p ? 'aria-current="page"' : ''}>${icon(ic)}<span class="nav-label">${esc(t(label))}</span></a></li>`,
    )
    .join('')}<li><a href="#more" data-more ${tab === 'more' ? 'aria-current="page"' : ''} aria-haspopup="dialog">${icon('more')}<span class="nav-label">More</span></a></li></ul>`;
  nav.querySelector('[data-more]').addEventListener('click', (e) => {
    e.preventDefault();
    openMoreSheet(page);
  });
  return nav;
}

export function openMoreSheet(page) {
  const links = ['collections', 'styles', 'budget', 'materials', 'standards', 'settings', 'patterns']
    .map(
      (p) =>
        `<li><a href="${href(p)}" ${page === p ? 'aria-current="page"' : ''}>${icon(PAGES[p].icon)}<span>${esc(t(PAGES[p].label))}</span></a></li>`,
    )
    .join('');
  openSheet({ title: 'More', body: `<ul class="action-list" role="list">${links}</ul>` });
}

/** Minimise the bottom bar while scrolling down; restore on scroll up or at the top. */
export function initNavMinimise(nav) {
  let lastY = window.scrollY;
  let acc = 0;
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      const d = y - lastY;
      lastY = y;
      acc = Math.sign(d) === Math.sign(acc) ? acc + d : d;
      if (y < 80 || acc < -24) nav.classList.remove('is-minimised');
      else if (acc > 32) nav.classList.add('is-minimised');
    },
    { passive: true },
  );
  nav.addEventListener('focusin', () => nav.classList.remove('is-minimised'));
}

export function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'app-footer';
  const links = ['explore', 'categories', 'collections', 'styles', 'materials', 'standards', 'budget', 'moodboards', 'settings', 'patterns']
    .map((p) => `<li><a href="${href(p)}">${esc(t(p === 'moodboards' ? 'nav.moodboardsLong' : PAGES[p].label))}</a></li>`)
    .join('');
  footer.innerHTML = `
    <div class="container footer-grid">
      <div>
        <a class="brand" href="${href('home')}">${brandMark}<span class="brand__name">${esc(brandName())}</span></a>
        <p style="margin-top:12px;max-width:34rem">${esc(t('footer.disclaimer'))}</p>
        <p style="margin-top:12px"><a href="${href('settings')}#version" class="link">${esc(t('footer.version', { version: APP_VERSION }))}</a></p>
      </div>
      <nav aria-label="Site"><ul role="list">${links}</ul></nav>
    </div>`;
  return footer;
}
