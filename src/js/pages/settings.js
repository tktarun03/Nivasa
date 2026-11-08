import { bootPage, applyPreferences } from '../app.js';
import { store, storageIsMemoryOnly } from '../storage/store.js';
import { preferenceFields, readPreferenceForm, openOnboarding } from '../components/onboarding.js';
import { LOCALES, translationStatus, applyI18n } from '../i18n.js';
import { RELEASES, APP_VERSION } from '../releases.js';
import { DEFAULT_BRAND } from '../config.js';
import { exportBackup, importBackupFile } from '../services/backup.js';
import { hapticsSupported, haptic } from '../services/haptics.js';
import { loadDesigns } from '../services/catalog.js';
import { toast } from '../components/toast.js';
import { confirmSheet } from '../components/sheet.js';
import { withBusy } from '../interactions/press.js';
import { asset } from '../navigation.js';
import { esc, formatDate } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';

bootPage({ page: 'settings' }, async () => {
  const root = document.getElementById('settings-root');
  const orientationLockable = typeof screen !== 'undefined' && !!screen.orientation?.lock;

  function render() {
    const s = store.get();
    const p = s.prefs;
    root.innerHTML = `
      ${storageIsMemoryOnly ? `<p class="callout" role="alert">${icon('warning')}<span>This browser is blocking storage (for example in private browsing). Changes will be lost when you leave. Save a backup file to keep them.</span></p>` : ''}
      <section class="section--tight" id="preferences" aria-labelledby="pref-title">
        <h2 id="pref-title">Your home</h2>
        <p class="small muted" style="margin:6px 0 16px">Used to personalise suggestions and pre-fill the budget planner. Stored only on this device.</p>
        <form id="pref-form" class="card">${preferenceFields(p, 'st')}<div class="cluster" style="margin-top:20px"><button type="submit" class="btn btn--primary">${icon('check')} Save preferences</button><button type="button" class="btn" data-replay>${icon('play')} Replay welcome tour</button></div></form>
      </section>

      <section class="section--tight" aria-labelledby="look-title" style="padding-top:32px">
        <h2 id="look-title">Appearance</h2>
        <div class="card" style="margin-top:16px">
          <div class="field"><span class="label" id="theme-label">Theme</span>
            <div class="scope-bar" role="group" aria-labelledby="theme-label">${[['system', 'monitor', 'System'], ['light', 'sun', 'Light'], ['dark', 'moon', 'Dark']].map(([v, ic, l]) => `<button type="button" data-theme-set="${v}" aria-pressed="${p.theme === v}">${icon(ic, { size: 16 })} ${l}</button>`).join('')}</div></div>
          <div class="field"><label for="text-scale">Text size <span class="muted num" id="text-scale-val">${Math.round(p.textScale * 100)}%</span></label>
            <input type="range" class="range" id="text-scale" min="0.9" max="1.3" step="0.05" value="${p.textScale}" aria-valuetext="${Math.round(p.textScale * 100)} percent"></div>
          <div class="field"><label for="motion">Motion</label>
            <select class="select" id="motion"><option value="system" ${p.motion !== 'reduce' ? 'selected' : ''}>Follow system setting</option><option value="reduce" ${p.motion === 'reduce' ? 'selected' : ''}>Reduce motion</option></select></div>
          <div class="field"><span class="label" id="units-label">Area units</span>
            <div class="scope-bar" role="group" aria-labelledby="units-label"><button type="button" data-units="sqft" aria-pressed="${p.units === 'sqft'}">Square feet</button><button type="button" data-units="sqm" aria-pressed="${p.units === 'sqm'}">Square metres</button></div></div>
        </div>
      </section>

      <section class="section--tight" aria-labelledby="lang-title" style="padding-top:32px">
        <h2 id="lang-title">Language</h2>
        <div class="card" style="margin-top:16px">
          <div class="field"><label for="lang">App language</label>
            <select class="select" id="lang">${Object.entries(LOCALES).map(([code, l]) => {
              const st = translationStatus(code);
              return `<option value="${code}" ${p.language === code ? 'selected' : ''}>${esc(l.name)}${code !== 'en' ? ` — ${st.done ? `${st.done}/${st.total} strings` : 'not yet translated'}` : ''}</option>`;
            }).join('')}</select>
            <span class="hint">Hindi and Tamil are prepared but not translated yet; untranslated text stays in English. Translations will be reviewed by native speakers before release.</span></div>
        </div>
      </section>

      <section class="section--tight" aria-labelledby="dev-title" style="padding-top:32px">
        <h2 id="dev-title">Device</h2>
        <div class="card" style="margin-top:16px">
          <div class="switch-row"><label class="switch-text" for="haptics">Haptic feedback<span>${hapticsSupported ? 'Short vibrations on supported Android browsers.' : 'Not supported by this browser (for example iOS Safari) — nothing will vibrate.'}</span></label><input type="checkbox" class="switch" id="haptics" ${p.haptics ? 'checked' : ''} ${hapticsSupported ? '' : 'disabled'}></div>
          <div class="switch-row"><label class="switch-text" for="portrait">Keep portrait in the photo viewer<span>${orientationLockable ? 'Asks the browser to hold portrait while viewing full screen. Some browsers refuse; landscape is never blocked.' : 'This browser does not allow apps to lock orientation, so rotation always follows your device.'}</span></label><input type="checkbox" class="switch" id="portrait" ${p.keepPortrait ? 'checked' : ''} ${orientationLockable ? '' : 'disabled'}></div>
        </div>
      </section>

      <section class="section--tight" aria-labelledby="brand-title" style="padding-top:32px">
        <h2 id="brand-title">Brand name</h2>
        <form class="card" id="brand-form" style="margin-top:16px"><div class="field"><label for="brand">Name shown in the app</label>
          <div class="input-group"><input class="input" id="brand" maxlength="40" placeholder="${esc(DEFAULT_BRAND)}" value="${esc(p.brandName)}"><button type="submit" class="btn">Save</button></div>
          <span class="hint">For studios using this app with clients. Leave empty for the default.</span></div></form>
      </section>

      <section class="section--tight" aria-labelledby="data-title" style="padding-top:32px">
        <h2 id="data-title">Your data</h2>
        <div class="card" style="margin-top:16px">
          <p class="small" style="color:var(--ink-2)">${s.favourites.length} favourites · ${s.boards.length} boards · saved only in this browser. Safari may clear site data after a while without visits, and iPhone Home Screen apps keep separate storage — keep a backup file.</p>
          <div class="cluster" style="margin-top:16px">
            <button type="button" class="btn" data-export>${icon('download')} Save backup file</button>
            <label class="btn" for="import-file" style="cursor:pointer">${icon('upload')} Restore from file</label>
            <input type="file" id="import-file" accept="application/json,.json" class="sr-only">
            <button type="button" class="btn btn--danger" data-clear>${icon('trash')} Erase all data</button>
          </div>
        </div>
      </section>

      <section class="section--tight" aria-labelledby="check-title" style="padding-top:32px">
        <h2 id="check-title">Self-check</h2>
        <div class="card" style="margin-top:16px">
          <p class="small muted">Runs real checks on this device: storage, saved data, catalogue, images, offline support and version.</p>
          <div id="check-out" style="margin-top:12px"></div>
          <button type="button" class="btn" style="margin-top:12px" data-check>${icon('clipboard')} Run self-check</button>
        </div>
      </section>

      <section class="section--tight" id="version" aria-labelledby="ver-title" style="padding-top:32px">
        <h2 id="ver-title">Version history</h2>
        <p class="small muted" style="margin-top:6px">You're on version <strong class="num">${esc(APP_VERSION)}</strong>.</p>
        ${RELEASES.map((r) => `<article class="card" style="margin-top:16px"><p class="eyebrow">v${esc(r.version)} · ${esc(formatDate(r.date))}</p><h3 style="margin-top:4px">${esc(r.title)}</h3><ul class="small" style="padding-left:1.1em;margin:8px 0 0;color:var(--ink-2)">${r.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></article>`).join('')}
      </section>

      <section class="section--tight" aria-labelledby="about-title" style="padding-top:32px">
        <h2 id="about-title">About and credits</h2>
        <div class="card prose small" style="margin-top:16px;color:var(--ink-2)">
          <p>All design images are original vector illustrations generated for this app. They are demonstration concepts, not photographs of real projects.</p>
          <p>Budgets are an illustrative model, not quotations. The standards guide identifies documents and marks what still needs professional verification.</p>
          <p>Built with Vite, GSAP, Swiper, PhotoSwipe, Lucide icons, Fuse.js and the Manrope typeface (SIL Open Font License).</p>
        </div>
      </section>`;
  }
  render();

  const setPref = (patch, msg) => {
    if (store.update((s) => void Object.assign(s.prefs, patch))) {
      applyPreferences();
      if (msg) toast(msg, { kind: 'good' });
      return true;
    }
    return false;
  };

  root.addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.id === 'pref-form') setPref(readPreferenceForm(e.target), 'Preferences saved');
    if (e.target.id === 'brand-form') {
      setPref({ brandName: root.querySelector('#brand').value.trim() }, 'Brand name saved');
      document.querySelectorAll('.brand__name').forEach((n) => (n.textContent = root.querySelector('#brand').value.trim() || DEFAULT_BRAND));
    }
  });

  root.addEventListener('click', async (e) => {
    const th = e.target.closest('[data-theme-set]');
    if (th) {
      const prev = store.get().prefs.theme;
      setPref({ theme: th.dataset.themeSet });
      root.querySelectorAll('[data-theme-set]').forEach((b) => b.setAttribute('aria-pressed', String(b === th)));
      toast('Theme changed', { undo: () => (setPref({ theme: prev }), render()) });
      return;
    }
    const un = e.target.closest('[data-units]');
    if (un) {
      setPref({ units: un.dataset.units });
      root.querySelectorAll('[data-units]').forEach((b) => b.setAttribute('aria-pressed', String(b === un)));
      return;
    }
    if (e.target.closest('[data-replay]')) return openOnboarding({ onDone: render });
    if (e.target.closest('[data-export]')) return exportBackup();
    if (e.target.closest('[data-clear]')) {
      const ok = await confirmSheet({ title: 'Erase all data?', message: 'This removes your favourites, mood boards, preferences and budget draft from this browser. It cannot be undone — save a backup file first if you might want them back.', confirmLabel: 'Erase everything' });
      if (ok) {
        store.reset();
        applyPreferences();
        render();
        toast('All data erased', { body: 'This browser now has a fresh start.' });
      }
      return;
    }
    const chk = e.target.closest('[data-check]');
    if (chk) withBusy(chk, runSelfCheck);
  });

  root.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.id === 'motion') setPref({ motion: t.value }, t.value === 'reduce' ? 'Motion reduced' : 'Motion follows your system');
    if (t.id === 'lang') {
      setPref({ language: t.value });
      applyI18n();
      if (t.value !== 'en') toast('Language set', { body: 'Not translated yet — English is shown until translations are added.' });
    }
    if (t.id === 'haptics') {
      setPref({ haptics: t.checked });
      if (t.checked) haptic('success');
    }
    if (t.id === 'portrait') setPref({ keepPortrait: t.checked });
    if (t.id === 'import-file' && t.files[0]) {
      try {
        const data = await importBackupFile(t.files[0]);
        applyPreferences();
        render();
        toast('Backup restored', { kind: 'good', body: `${data.favourites.length} favourites · ${data.boards.length} boards` });
      } catch (err) {
        toast("Couldn't restore", { kind: 'bad', body: err.message });
      }
      t.value = '';
    }
  });
  root.addEventListener('input', (e) => {
    if (e.target.id !== 'text-scale') return;
    const v = Number(e.target.value);
    document.getElementById('text-scale-val').textContent = `${Math.round(v * 100)}%`;
    e.target.setAttribute('aria-valuetext', `${Math.round(v * 100)} percent`);
    setPref({ textScale: v });
  });

  async function runSelfCheck() {
    const out = document.getElementById('check-out');
    const checks = [
      ['Storage writes', async () => {
        if (storageIsMemoryOnly) throw new Error('Browser storage blocked — data is kept in memory only');
        const k = '__iis_selfcheck__';
        localStorage.setItem(k, '1');
        localStorage.removeItem(k);
        return 'OK';
      }],
      ['Catalogue loads', async () => `${(await loadDesigns()).length} designs`],
      ['Saved data is consistent', async () => {
        const ds = new Set((await loadDesigns()).map((d) => d.id));
        const s = store.get();
        const missing = [...s.favourites, ...s.boards.flatMap((b) => b.items.map((i) => i.designId))].filter((id) => !ds.has(id));
        if (missing.length) throw new Error(`${missing.length} saved item(s) no longer in the catalogue`);
        return `${s.favourites.length} favourites, ${s.boards.length} boards`;
      }],
      ['Images reachable', async () => {
        const d = (await loadDesigns())[0];
        const r = await fetch(asset(d.images[0].src), { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return 'OK';
      }],
      ['Offline support', async () => {
        if (!('serviceWorker' in navigator)) throw new Error('Not supported in this browser');
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) throw new Error('Not installed yet (it installs on the first visit to the published site)');
        return 'Installed';
      }],
      ['Version', async () => {
        const top = RELEASES[0].version;
        if (top !== APP_VERSION) throw new Error(`App ${APP_VERSION}, notes ${top}`);
        return `v${APP_VERSION}`;
      }],
    ];
    const C = 2 * Math.PI * 26;
    const rows = [];
    let done = 0;
    const paint = () => {
      out.innerHTML = `<div style="display:flex;gap:16px;align-items:center"><div class="ring" role="progressbar" aria-label="Self-check progress" aria-valuemin="0" aria-valuemax="${checks.length}" aria-valuenow="${done}"><svg viewBox="0 0 64 64"><circle class="ring__track" cx="32" cy="32" r="26"/><circle class="ring__value" cx="32" cy="32" r="26" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - done / checks.length)}"/></svg><span class="ring__label">${done}/${checks.length}</span></div>
        <ul class="checklist" style="flex:1">${rows.map((r) => `<li class="${r.ok ? 'is-done' : ''}"><span class="tick" style="${r.ok ? '' : 'border-color:var(--danger)'}">${icon(r.ok ? 'check' : 'x')}</span><span><strong style="font-weight:500">${esc(r.name)}</strong><span class="tiny muted" style="display:block">${esc(r.msg)}</span></span></li>`).join('')}</ul></div>`;
    };
    paint();
    for (const [name, fn] of checks) {
      try {
        rows.push({ name, ok: true, msg: await fn() });
      } catch (err) {
        rows.push({ name, ok: false, msg: err.message });
      }
      done += 1;
      paint();
    }
    const failed = rows.filter((r) => !r.ok).length;
    toast(failed ? `${failed} check${failed === 1 ? '' : 's'} need attention` : 'All checks passed', { kind: failed ? 'bad' : 'good' });
  }

  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
});
