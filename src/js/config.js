/**
 * White-label configuration. The default brand name can be overridden by the
 * person in Settings (stored locally) or by a fork editing DEFAULT_BRAND.
 */
import { store } from './storage/store.js';

export const DEFAULT_BRAND = 'Nivasa';
export const REPO_URL = 'https://github.com/tktarun03/Nivasa';

export function brandName() {
  const custom = store.get().prefs.brandName?.trim();
  return custom || DEFAULT_BRAND;
}
