/** Share via the native share sheet, then clipboard, then a copy box. */
import { toast } from '../components/toast.js';
import { openSheet } from '../components/sheet.js';
import { esc } from '../utilities/dom.js';
import { t } from '../i18n.js';

export async function share({ title, text, url = location.href }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      toast(t('toast.linkCopied'), { kind: 'good', body: title });
      return 'copied';
    } catch {}
  }
  const sheet = openSheet({
    title: 'Copy link',
    body: `<p class="small muted">Copy this link to share it.</p><input class="input" readonly value="${esc(url)}" aria-label="Link to share" style="margin-top:12px">`,
  });
  const input = sheet.el.querySelector('input');
  input.focus();
  input.select();
  return 'manual';
}
