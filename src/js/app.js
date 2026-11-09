/**
 * Shared page boot. Every entry page calls:
 *   bootPage({ page: 'explore', back: false }, async (ctx) => { ...page code... })
 * It applies preferences (theme, text size, motion, language), renders the
 * shell, registers the service worker, shows onboarding on first launch and
 * the one-time "Updated to version X" notice, then runs the page.
 */
import '../styles/main.css';
import { store, storageIsMemoryOnly } from './storage/store.js';
import { setLocale, applyI18n, t } from './i18n.js';
import { renderHeader, renderBottomNav, renderFooter, initNavMinimise, href } from './navigation.js';
import { hydrateIcons } from './utilities/icons.js';
import { initMotion, initScrollProgress, initPathDrawing } from './interactions/motion.js';
import { initPressFeedback } from './interactions/press.js';
import { initTilt } from './interactions/tilt.js';
import { toast } from './components/toast.js';
import { shouldShowOnboarding, openOnboarding } from './components/onboarding.js';
import { APP_VERSION, RELEASES } from './releases.js';
import { exportBackup } from './services/backup.js';
import { brandName } from './config.js';

export function applyPreferences(prefs = store.get().prefs) {
  const root = document.documentElement;
  if (prefs.theme === 'light' || prefs.theme === 'dark') root.dataset.theme = prefs.theme;
  else delete root.dataset.theme;
  root.style.setProperty('--text-scale', String(prefs.textScale || 1));
  if (prefs.motion === 'reduce') root.dataset.motion = 'reduce';
  else delete root.dataset.motion;
  setLocale(prefs.language || 'en');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const dark = prefs.theme === 'dark' || (prefs.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
    meta.content = dark ? '#161412' : '#faf7f2';
  }
}

/** Compact live status in the header — the web stand-in for a "Dynamic Island". */
export function setLiveStatus(state, text) {
  const el = document.getElementById('live-status');
  if (!el) return;
  el.dataset.state = state;
  el.querySelector('.live-status__text').textContent = text;
}

function wireLiveStatus() {
  const base = () => (navigator.onLine ? ['ok', storageIsMemoryOnly ? t('status.memory') : t('status.online')] : ['offline', t('status.offline')]);
  setLiveStatus(...base());
  store.subscribe(() => {
    setLiveStatus('saving', t('status.saving'));
    clearTimeout(wireLiveStatus.t);
    wireLiveStatus.t = setTimeout(() => setLiveStatus(...base()), 700);
  });
  store.onError(() => {
    setLiveStatus('error', t('status.error'));
    toast(t('toast.couldNotSave'), { kind: 'bad', body: t('toast.couldNotSaveBody'), action: { label: t('toast.backup'), fn: exportBackup } });
  });
  window.addEventListener('offline', () => {
    setLiveStatus(...base());
    toast(t('toast.offline'), { body: t('toast.offlineBody') });
  });
  window.addEventListener('online', () => {
    setLiveStatus(...base());
    toast(t('toast.online'), { kind: 'good' });
  });
}

function versionNotice() {
  const s = store.get();
  if (!s.installedVersion) {
    // First install: remember the version quietly, no "updated" notice.
    store.update((d) => void ((d.installedVersion = APP_VERSION), (d.lastSeenVersion = APP_VERSION)), { silent: true });
    return;
  }
  if (s.lastSeenVersion !== APP_VERSION) {
    store.update((d) => void (d.lastSeenVersion = APP_VERSION), { silent: true });
    const rel = RELEASES.find((r) => r.version === APP_VERSION);
    toast(t('toast.updated', { version: APP_VERSION }), {
      body: rel?.notes?.[0],
      action: { label: t('toast.whatsNew'), fn: () => (location.href = `${href('settings')}#version`) },
    });
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  if (!/^https?:$/.test(location.protocol)) return;
  const root = document.querySelector('meta[name="app-root"]')?.content ?? './';
  navigator.serviceWorker.register(`${root}sw.js?v=${APP_VERSION}`, { scope: root }).catch(() => {});
}

export async function bootPage(opts, init) {
  const { page, back = false, title } = opts;
  applyPreferences();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyPreferences());
  if (title) document.title = `${title} · ${brandName()}`;
  else document.title = document.title.replace('Nivasa', brandName());

  // Shell
  const skip = document.createElement('a');
  skip.className = 'skip-link';
  skip.href = '#main';
  skip.textContent = t('nav.skip');
  const header = renderHeader(page, { back });
  const nav = renderBottomNav(page);
  document.body.prepend(skip, header);
  document.body.append(renderFooter(), nav);
  const live = document.createElement('div');
  live.id = 'sr-live';
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  document.body.append(live);

  applyI18n();
  hydrateIcons();
  initNavMinimise(nav);
  initScrollProgress();
  initPressFeedback();
  wireLiveStatus();
  registerServiceWorker();

  const ctx = { page, store, params: new URLSearchParams(location.search) };
  try {
    await init?.(ctx);
  } catch (err) {
    console.error(err);
    const main = document.getElementById('main');
    main?.insertAdjacentHTML(
      'beforeend',
      `<div class="container"><div class="state" role="alert"><h2>Something went wrong</h2><p>This page couldn't finish loading. Your saved designs are safe.</p><div class="cluster"><button class="btn" type="button" onclick="location.reload()">Reload page</button></div></div></div>`,
    );
  }
  hydrateIcons();
  initMotion();
  initPathDrawing();
  initTilt();

  if (page !== 'settings' && shouldShowOnboarding()) openOnboarding({ onDone: () => ctx.onPreferencesChanged?.() });
  else versionNotice();
  return ctx;
}
