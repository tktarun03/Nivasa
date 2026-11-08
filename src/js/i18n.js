/**
 * Internationalisation. English ships complete; Hindi and Tamil files exist so
 * translators can fill them without touching page markup. Missing keys fall
 * back to English. Static markup uses data-i18n="key" (text) and
 * data-i18n-attr="attr:key" (attributes).
 */
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';
import ta from '../i18n/ta.json';

export const LOCALES = {
  en: { dict: en, htmlLang: 'en-IN', name: 'English' },
  hi: { dict: hi, htmlLang: 'hi-IN', name: 'हिन्दी (Hindi)' },
  ta: { dict: ta, htmlLang: 'ta-IN', name: 'தமிழ் (Tamil)' },
};

let current = 'en';

export function setLocale(code) {
  current = LOCALES[code] ? code : 'en';
  document.documentElement.lang = LOCALES[current].htmlLang;
}
export const getLocale = () => current;

export function translationStatus(code) {
  const meta = LOCALES[code]?.dict?._meta || {};
  const keys = Object.keys(en).filter((k) => k !== '_meta');
  const done = keys.filter((k) => LOCALES[code]?.dict?.[k]).length;
  return { ...meta, done, total: keys.length };
}

/** t('common.results', { count: 4 }) — placeholders keep user data out of sentences. */
export function t(key, vars) {
  const str = LOCALES[current]?.dict?.[key] ?? en[key] ?? key;
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':');
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    });
  });
}
