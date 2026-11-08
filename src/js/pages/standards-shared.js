/** Shared helpers for showing standards review status consistently. */
import standardsData from '../../data/standards.json';
import { esc } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';

const STATUS = Object.fromEntries(standardsData.reviewStatuses.map((s) => [s.id, s]));
const CLS = { confirmed: 'badge--ok', secondary: 'badge--warn', verify: 'badge--danger', superseded: 'badge', guidance: 'badge--demo' };
const ICON = { confirmed: 'check-circle', secondary: 'info', verify: 'warning', superseded: 'history', guidance: 'info' };

export function statusBadge(id) {
  const s = STATUS[id];
  if (!s) return '';
  return `<span class="badge ${CLS[id] || ''}" title="${esc(s.description)}">${icon(ICON[id] || 'info')}${esc(s.name)}</span>`;
}
export const statusInfo = (id) => STATUS[id];
