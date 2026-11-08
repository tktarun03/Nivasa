/**
 * Optional haptic feedback through the Vibration API. Only some Android
 * browsers support it; iOS Safari does not, so this silently does nothing there.
 * Respects the Settings → Haptics switch.
 */
import { store } from '../storage/store.js';

const PATTERNS = { light: 8, medium: 16, success: [10, 40, 12], error: [30, 50, 30] };

export const hapticsSupported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export function haptic(kind = 'light') {
  if (!hapticsSupported) return false;
  if (!store.get().prefs.haptics) return false;
  try {
    return navigator.vibrate(PATTERNS[kind] ?? PATTERNS.light);
  } catch {
    return false;
  }
}
