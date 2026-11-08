/**
 * Infinite scroll over real paginated data. A sentinel below the list asks for
 * the next page; when there are no more pages an end-of-results state replaces it.
 * A "Load more" button is always present for keyboard and assistive-tech users.
 */
import { icon } from '../utilities/icons.js';
import { esc } from '../utilities/dom.js';

export function createInfiniteList({ container, footer, loadPage, renderItems, onEmpty, endLabel = (n) => `You've seen all ${n}` }) {
  let page = 0;
  let loading = false;
  let done = false;
  let total = 0;
  let generation = 0;
  let io = null;

  async function next() {
    if (loading || done) return;
    loading = true;
    const gen = generation;
    footer.innerHTML = `<div class="loader-row" role="status"><span class="spinner" aria-hidden="true"></span><span class="sr-only">Loading more designs</span></div>`;
    try {
      const res = await loadPage(page);
      if (gen !== generation) return; // a reset happened while loading
      total = res.total;
      if (page === 0 && res.total === 0) {
        done = true;
        footer.innerHTML = '';
        onEmpty?.();
        return;
      }
      renderItems(res.items, page);
      page += 1;
      done = !res.hasMore;
      footer.innerHTML = done
        ? `<p class="end-of-list" role="status">${esc(endLabel(total))}</p>`
        : `<div class="loader-row"><button type="button" class="btn btn--sm" data-load-more>Load more</button></div><div data-sentinel style="height:1px"></div>`;
      footer.querySelector('[data-load-more]')?.addEventListener('click', next);
      const s = footer.querySelector('[data-sentinel]');
      if (s) io.observe(s);
    } catch (err) {
      footer.innerHTML = `<div class="state"><p>Couldn't load more designs.</p><div class="cluster"><button type="button" class="btn btn--sm" data-retry>${icon('refresh')} Retry</button></div></div>`;
      footer.querySelector('[data-retry]').addEventListener('click', next);
      console.error(err);
    } finally {
      if (gen === generation) loading = false;
    }
  }

  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        entries.forEach((e) => io.unobserve(e.target));
        next();
      }
    },
    { rootMargin: '600px 0px' },
  );

  function reset() {
    generation += 1;
    page = 0;
    done = false;
    loading = false;
    total = 0;
    io.disconnect();
    container.innerHTML = '';
    footer.innerHTML = '';
    return next();
  }

  return { next, reset, get total() { return total; } };
}
