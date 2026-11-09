import { bootPage } from '../app.js';
import { loadDesigns, nameOf } from '../services/catalog.js';
import { store } from '../storage/store.js';
import {
  createBoard, renameBoard, deleteBoard, removeItem, insertItem, moveItem, toggleItemLock, setCoverLock, coverFor,
} from '../storage/boards.js';
import { frame, wireImages } from '../components/media.js';
import { designCard, bindDesignCards } from '../components/designCard.js';
import { promptSheet, confirmSheet, actionSheet } from '../components/sheet.js';
import { toast, hud } from '../components/toast.js';
import { initReorder } from '../interactions/reorder.js';
import { initSwipeActions } from '../interactions/swipeActions.js';
import { onLongPress } from '../interactions/gestures.js';
import { href } from '../navigation.js';
import { esc, uid, plural, updateQuery, announce, formatDate } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { haptic } from '../services/haptics.js';

bootPage({ page: 'moodboards' }, async (ctx) => {
  const root = document.getElementById('mb-root');
  const designs = await loadDesigns();
  const byId = (id) => designs.find((d) => d.id === id);
  let boardId = ctx.params.get('board');

  const save = (fn) => store.update((s) => void (s.boards = fn(s.boards)));

  function render() {
    const s = store.get();
    const board = boardId && s.boards.find((b) => b.id === boardId);
    if (boardId && !board) {
      boardId = null;
      updateQuery({ board: '' });
    }
    if (board) return renderBoard(board);
    renderIndex(s);
  }

  // ---------- Index: boards + favourites ----------
  function renderIndex(s) {
    document.getElementById('mb-title').textContent = 'Mood boards';
    document.getElementById('mb-lede').textContent = 'Collect designs, reorder them, and lock the reference photos you want to keep. Everything is saved on this device only.';
    const boards = s.boards;
    const favs = s.favourites.map(byId).filter(Boolean);
    root.innerHTML = `
      <div class="section-head"><h2>Your boards</h2><button type="button" class="btn btn--primary btn--sm" data-new>${icon('plus')} New board</button></div>
      ${
        boards.length
          ? `<ul class="list-grid" role="list" style="list-style:none;padding:0;margin:0">${boards
              .map((b) => {
                const c = coverFor(b);
                const cd = c && byId(c.designId);
                return `<li class="swipe-row" data-row="${esc(b.id)}">
                  <div class="swipe-row__actions"><button type="button" data-delete="${esc(b.id)}">${icon('trash')}Delete</button></div>
                  <div class="swipe-row__content">
                    <a class="cat-tile" href="${href('moodboards', { board: b.id })}" style="border:0">
                      <span class="cat-tile__thumb" style="width:64px;height:64px">${cd ? frame(cd, c.imageIndex, { label: false, cls: 'frame--square' }) : `<span style="display:grid;place-items:center;height:100%">${icon('bookmark')}</span>`}</span>
                      <span><span class="cat-tile__name">${esc(b.name)}</span><span class="cat-tile__count" style="display:block">${plural(b.items.length, 'item')}${b.coverLock ? ' · cover locked' : ''}</span></span>
                      ${icon('chevron-right')}
                    </a>
                  </div></li>`;
              })
              .join('')}</ul><p class="tiny muted" style="margin-top:8px">Swipe a board left to delete it, or open it for more options.</p>`
          : `<div class="state">${icon('bookmark', { cls: 'state__icon' })}<h3>No boards yet</h3><p>Create a board for each room or project, then save designs to it from any design page.</p><div class="cluster"><button type="button" class="btn btn--primary" data-new>${icon('plus')} Create your first board</button><a class="btn" href="${href('explore')}">Explore designs</a></div></div>`
      }
      <section class="section" aria-labelledby="fav-title">
        <div class="section-head"><div><h2 id="fav-title">Favourites</h2><p>${plural(favs.length, 'design')}</p></div></div>
        ${
          favs.length
            ? `<div class="design-grid" id="fav-grid">${favs.map((d) => designCard(d)).join('')}</div>`
            : `<div class="state">${icon('heart', { cls: 'state__icon' })}<h3>No favourites yet</h3><p>Tap the heart on any design — or double-tap its picture — to keep it here.</p><div class="cluster"><a class="btn" href="${href('explore')}">Find designs</a></div></div>`
        }
      </section>`;
    wireImages(root);
    const grid = root.querySelector('#fav-grid');
    if (grid) bindDesignCards(grid, byId);
    root.querySelectorAll('.swipe-row').forEach((row) => initSwipeActions(row, { width: 84 }));
  }

  // ---------- A single board ----------
  function renderBoard(b) {
    document.getElementById('mb-title').textContent = b.name;
    document.getElementById('mb-lede').textContent = `${plural(b.items.length, 'item')} · created ${formatDate(b.createdAt)}`;
    const cover = coverFor(b);
    const cd = cover && byId(cover.designId);
    root.innerHTML = `
      <div class="cluster" style="margin-bottom:20px">
        <a class="btn btn--sm" href="${href('moodboards')}">${icon('back')} All boards</a>
        <button type="button" class="btn btn--sm" data-rename>${icon('pencil')} Rename</button>
        <button type="button" class="btn btn--sm btn--danger" data-delete="${esc(b.id)}">${icon('trash')} Delete board</button>
      </div>
      ${
        cd
          ? `<div class="board-cover" style="max-width:640px">${frame(cd, cover.imageIndex, { cls: 'frame--wide' })}${b.coverLock ? `<span class="badge badge--accent">${icon('lock')} Locked cover</span>` : ''}</div>
             <p class="tiny muted" style="margin:8px 0 24px">${b.coverLock ? 'This cover is locked: adding or reordering items will not replace it.' : 'Cover follows your most recent item. Lock a photo below to pin it as the cover.'}</p>`
          : ''
      }
      ${
        b.items.length
          ? `<ol class="board-items" id="board-items" aria-label="Board items, drag the handle or use the move buttons to reorder">${b.items
              .map((it, i) => {
                const d = byId(it.designId);
                if (!d) return '';
                const isCover = b.coverLock && b.coverLock.designId === it.designId && b.coverLock.imageIndex === it.imageIndex;
                return `<li class="board-item ${it.locked ? 'is-locked' : ''}" data-index="${i}">
                  <a href="${href('design', { id: d.id })}" aria-label="${esc(d.title)}">${frame(d, it.imageIndex, { cls: 'frame--square', label: false })}</a>
                  <p class="board-item__title">${esc(d.title)}<span class="tiny muted" style="display:block;font-weight:400">${esc(nameOf(d.category))}${isCover ? ' · cover' : ''}</span></p>
                  <div class="board-item__tools">
                    <button type="button" class="icon-btn drag-handle" aria-label="Drag to reorder ${esc(d.title)}">${icon('grip')}</button>
                    <button type="button" class="icon-btn" data-move="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move earlier">${icon('arrow-up')}</button>
                    <button type="button" class="icon-btn" data-move="1" ${i === b.items.length - 1 ? 'disabled' : ''} aria-label="Move later">${icon('arrow-down')}</button>
                    <button type="button" class="icon-btn" data-item-lock aria-pressed="${it.locked}" aria-label="${it.locked ? 'Unlock photo' : 'Lock photo'}">${icon(it.locked ? 'lock' : 'unlock')}</button>
                    <button type="button" class="icon-btn" data-remove ${it.locked ? 'disabled' : ''} aria-label="${it.locked ? 'Unlock to remove' : 'Remove from board'}">${icon('trash')}</button>
                  </div>
                </li>`;
              })
              .join('')}</ol>
             <p class="tiny muted" style="margin-top:12px">Touch and hold an item for more options. Locked photos can't be removed or replaced until you unlock them.</p>`
          : `<div class="state">${icon('images', { cls: 'state__icon' })}<h3>This board is empty</h3><p>Open any design and choose “Save to board”.</p><div class="cluster"><a class="btn btn--primary" href="${href('explore')}">Explore designs</a></div></div>`
      }`;
    wireImages(root);
    const list = root.querySelector('#board-items');
    if (list) {
      initReorder(list, {
        itemSelector: '.board-item',
        handleSelector: '.drag-handle',
        onMove: (from, to) => move(from, to),
      });
      list.querySelectorAll('.board-item').forEach((el) => onLongPress(el, () => itemActions(Number(el.dataset.index))));
    }
  }

  function move(from, to) {
    if (save((bs) => moveItem(bs, boardId, from, to))) {
      haptic('light');
      announce(`Moved to position ${to + 1}`);
      render();
      root.querySelector(`.board-item[data-index="${to}"] .drag-handle`)?.focus();
    }
  }

  function removeAt(i) {
    const board = store.get().boards.find((b) => b.id === boardId);
    const item = board?.items[i];
    if (!item) return;
    if (item.locked) {
      toast('This photo is locked', { body: 'Unlock it before removing.' });
      return;
    }
    const prevCover = board.coverLock;
    if (save((bs) => removeItem(bs, boardId, i))) {
      render();
      toast('Removed from board', {
        body: byId(item.designId)?.title,
        undo: () => {
          // Re-check current state before restoring (BasKar rule)
          const now = store.get().boards.find((b) => b.id === boardId);
          if (!now) return toast("Couldn't undo", { kind: 'bad', body: 'The board no longer exists.' });
          save((bs) => {
            let next = insertItem(bs, boardId, i, item);
            if (prevCover) next = setCoverLock(next, boardId, prevCover);
            return next;
          });
          render();
        },
      });
    }
  }

  function toggleLock(i) {
    const board = store.get().boards.find((b) => b.id === boardId);
    const it = board.items[i];
    const willLock = !it.locked;
    if (
      save((bs) => {
        let next = toggleItemLock(bs, boardId, i);
        // Locking a photo also pins it as the cover; unlocking the cover photo releases it.
        if (willLock) next = setCoverLock(next, boardId, it);
        else if (board.coverLock?.designId === it.designId && board.coverLock?.imageIndex === it.imageIndex) next = setCoverLock(next, boardId, null);
        return next;
      })
    ) {
      haptic('medium');
      hud(willLock ? 'Photo locked' : 'Photo unlocked', willLock ? 'lock' : 'unlock');
      render();
    }
  }

  async function itemActions(i) {
    const board = store.get().boards.find((b) => b.id === boardId);
    const it = board?.items[i];
    if (!it) return;
    haptic('medium');
    const choice = await actionSheet({
      title: byId(it.designId)?.title || 'Item',
      actions: [
        { id: 'open', label: 'Open design', icon: 'expand' },
        { id: 'lock', label: it.locked ? 'Unlock photo' : 'Lock photo as cover', icon: it.locked ? 'unlock' : 'lock' },
        { id: 'first', label: 'Move to first', icon: 'arrow-up' },
        ...(it.locked ? [] : [{ id: 'remove', label: 'Remove from board', icon: 'trash', danger: true }]),
      ],
    });
    if (choice === 'open') location.href = href('design', { id: it.designId });
    if (choice === 'lock') toggleLock(i);
    if (choice === 'first') move(i, 0);
    if (choice === 'remove') removeAt(i);
  }

  async function newBoard() {
    const name = await promptSheet({ title: 'New mood board', label: 'Board name', placeholder: 'e.g. Kitchen ideas', confirmLabel: 'Create' });
    if (!name) return;
    const id = uid('board');
    if (save((bs) => createBoard(bs, name, id))) {
      toast('Board created', { kind: 'good', body: name });
      boardId = id;
      updateQuery({ board: id }, { replace: false });
      render();
    }
  }

  async function removeBoard(id) {
    const b = store.get().boards.find((x) => x.id === id);
    if (!b) return;
    if (b.items.some((it) => it.locked)) {
      const ok = await confirmSheet({ title: `Delete “${b.name}”?`, message: 'This board has locked photos. Deleting the board removes them too. You can undo for a few seconds.', confirmLabel: 'Delete board' });
      if (!ok) return render();
    }
    const prev = store.get().boards;
    if (save((bs) => deleteBoard(bs, id))) {
      if (boardId === id) {
        boardId = null;
        updateQuery({ board: '' });
      }
      render();
      toast('Board deleted', { body: b.name, undo: () => (store.update((s) => void (s.boards = prev)), render()) });
    }
  }

  root.addEventListener('click', async (e) => {
    if (e.target.closest('[data-new]')) return newBoard();
    const del = e.target.closest('[data-delete]');
    if (del) return removeBoard(del.dataset.delete);
    if (e.target.closest('[data-rename]')) {
      const b = store.get().boards.find((x) => x.id === boardId);
      const name = await promptSheet({ title: 'Rename board', label: 'Board name', value: b.name });
      if (name && save((bs) => renameBoard(bs, boardId, name))) {
        toast('Board renamed', { kind: 'good', body: name });
        render();
      }
      return;
    }
    const item = e.target.closest('.board-item');
    if (!item) return;
    const i = Number(item.dataset.index);
    const mv = e.target.closest('[data-move]');
    if (mv) return move(i, i + Number(mv.dataset.move));
    if (e.target.closest('[data-item-lock]')) return toggleLock(i);
    if (e.target.closest('[data-remove]')) return removeAt(i);
  });

  window.addEventListener('popstate', () => {
    boardId = new URLSearchParams(location.search).get('board');
    render();
  });
  render();
});
