import { bootPage } from '../app.js';
import standardsData from '../../data/standards.json';
import { loadMaterials } from '../services/catalog.js';
import { esc, formatDate } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { href } from '../navigation.js';
import { statusBadge } from './standards-shared.js';

bootPage({ page: 'standards' }, async () => {
  const { tiers, documents, guidance, disclaimer, reviewStatuses } = standardsData;
  const { materials } = await loadMaterials();
  document.getElementById('std-disclaimer').innerHTML = `${icon('warning')}<span><strong>Important:</strong> ${esc(disclaimer)}</span>`;

  const usedBy = (docId) => materials.filter((m) => m.standards.includes(docId));
  const tabs = document.getElementById('std-tabs');
  const panels = document.getElementById('std-panels');

  const docCard = (d) => `<article class="card" id="${esc(d.id)}" style="margin-top:16px">
      <div class="cluster" style="justify-content:space-between"><p class="eyebrow">${esc(d.designation)}</p>${statusBadge(d.reviewStatus)}</div>
      <h3 style="margin-top:6px">${esc(d.title)}</h3>
      <p class="small" style="margin-top:8px;color:var(--ink-2)">${esc(d.scope)}</p>
      <dl class="spec-list" style="margin-top:16px">
        <dt>Issued by</dt><dd>${esc(d.authority)}</dd>
        <dt>Edition</dt><dd>${esc(d.edition)}</dd>
        ${d.section ? `<dt>Sections</dt><dd>${esc(d.section)}</dd>` : ''}
        <dt>Applicability</dt><dd>${esc(d.applicability)}</dd>
        <dt>Last checked</dt><dd>${esc(formatDate(d.verifiedOn))}</dd>
        ${usedBy(d.id).length ? `<dt>Materials</dt><dd>${usedBy(d.id).map((m) => `<a class="link" href="${href('materials')}#${esc(m.id)}">${esc(m.name)}</a>`).join(', ')}</dd>` : ''}
      </dl>
      ${d.notes ? `<p class="tiny muted" style="margin-top:12px">${esc(d.notes)}</p>` : ''}
      ${
        d.sources?.length
          ? `<details class="disclosure" style="margin-top:12px"><summary>Sources (${d.sources.length})</summary><div class="disclosure__body"><ul class="small" style="padding-left:1.1em;margin:0">${d.sources.map((s) => `<li><a class="link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ${icon('external')}</a></li>`).join('')}</ul></div></details>`
          : `<p class="callout" style="margin-top:12px">${icon('warning')}<span><strong>Requires professional verification.</strong> No source was confirmed for this release.</span></p>`
      }
    </article>`;

  const guideCard = (g) => `<article class="card" id="${esc(g.id)}" style="margin-top:16px">
      <div class="cluster" style="justify-content:space-between"><p class="eyebrow">${esc(g.topic.replace(/-/g, ' '))}</p>${statusBadge(g.reviewStatus)}</div>
      <h3 style="margin-top:6px">${esc(g.title)}</h3>
      <p class="small" style="margin-top:8px;color:var(--ink-2)">${esc(g.body)}</p>
      ${g.related?.length ? `<p class="tiny" style="margin-top:8px">See: ${g.related.map((r) => `<a class="link" href="#${esc(r)}">${esc(documents.find((d) => d.id === r)?.designation || r)}</a>`).join(', ')}</p>` : ''}
    </article>`;

  tabs.innerHTML = tiers.map((t, i) => `<button type="button" role="tab" id="tab-${t.id}" aria-controls="panel-${t.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(t.name)}</button>`).join('');
  panels.innerHTML = tiers
    .map((t, i) => {
      const docs = documents.filter((d) => d.tier === t.id);
      const tips = guidance.filter((g) => g.tier === t.id);
      return `<section role="tabpanel" id="panel-${t.id}" aria-labelledby="tab-${t.id}" ${i === 0 ? '' : 'hidden'} tabindex="0" style="padding:20px 0">
        <p class="lede" style="font-size:var(--fs-md)">${esc(t.description)}</p>
        ${t.id === 'cultural' ? `<p class="callout callout--info" style="margin-top:16px">${icon('info')}<span>Vastu is offered only as an optional cultural planning lens. It is separate from scientific safety, structural engineering and statutory requirements, and never overrides them.</span></p>` : ''}
        ${docs.map(docCard).join('')}${tips.map(guideCard).join('')}
        ${!docs.length && !tips.length ? '<p class="small muted">Nothing listed in this tier yet.</p>' : ''}
      </section>`;
    })
    .join('');
  panels.insertAdjacentHTML(
    'beforeend',
    `<section class="section" aria-labelledby="legend-title"><h2 id="legend-title" class="h3">How to read the status labels</h2><dl class="spec-list" style="margin-top:12px">${reviewStatuses.map((s) => `<dt>${statusBadge(s.id)}</dt><dd class="small">${esc(s.description)}</dd>`).join('')}</dl></section>`,
  );

  const allTabs = [...tabs.querySelectorAll('[role="tab"]')];
  const select = (tab, focus = true) => {
    allTabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.addEventListener('click', (e) => {
    const t = e.target.closest('[role="tab"]');
    if (t) select(t);
  });
  tabs.addEventListener('keydown', (e) => {
    const i = allTabs.indexOf(document.activeElement);
    if (e.key === 'ArrowRight') select(allTabs[(i + 1) % allTabs.length]);
    if (e.key === 'ArrowLeft') select(allTabs[(i - 1 + allTabs.length) % allTabs.length]);
  });

  // Deep link to a document: open its tab and scroll to it
  if (location.hash) {
    const el = document.getElementById(location.hash.slice(1));
    const panel = el?.closest('[role="tabpanel"]');
    if (panel) {
      select(document.getElementById(panel.getAttribute('aria-labelledby')), false);
      el.scrollIntoView();
    }
  }
});
