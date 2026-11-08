/** "Save to board" sheet: pick an existing mood board or create a new one. */
import { store } from '../storage/store.js';
import { openSheet, promptSheet } from './sheet.js';
import { toast } from './toast.js';
import { addItem, createBoard, hasItem, removeItem } from '../storage/boards.js';
import { esc, uid, plural } from '../utilities/dom.js';
import { icon } from '../utilities/icons.js';
import { href } from '../navigation.js';
import { haptic } from '../services/haptics.js';

export function openBoardPicker(design, imageIndex = 0) {
  const render = () => {
    const boards = store.get().boards;
    const list = boards.length
      ? `<ul class="action-list" role="list">${boards
          .map((b) => {
            const saved = hasItem(b, design.id, imageIndex);
            return `<li><button type="button" data-board="${esc(b.id)}" aria-pressed="${saved}">${icon(saved ? 'check-circle' : 'bookmark')}<span style="flex:1">${esc(b.name)}<span class="tiny muted" style="display:block">${plural(b.items.length, 'item')}</span></span>${saved ? '<span class="badge badge--ok">Saved</span>' : ''}</button></li>`;
          })
          .join('')}</ul>`
      : '<p class="small muted">You have no mood boards yet. Create one to start collecting ideas.</p>';
    return `${list}<div style="margin-top:16px"><button type="button" class="btn btn--block" data-new>${icon('plus')} New board</button></div>`;
  };
  const sheet = openSheet({ title: 'Save to mood board', body: render() });
  const rerender = () => (sheet.body.innerHTML = render());

  sheet.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-board]');
    if (b) {
      const boardId = b.dataset.board;
      const board = store.get().boards.find((x) => x.id === boardId);
      if (!board) return;
      if (hasItem(board, design.id, imageIndex)) {
        const idx = board.items.findIndex((it) => it.designId === design.id && it.imageIndex === imageIndex);
        if (board.items[idx].locked) {
          toast('This photo is locked', { body: 'Unlock it on the board before removing it.' });
          return;
        }
        const prev = store.get().boards;
        if (store.update((s) => void (s.boards = removeItem(s.boards, boardId, idx)))) {
          toast('Removed from board', { body: board.name, undo: () => store.update((s) => void (s.boards = prev)) });
        }
      } else if (store.update((s) => void (s.boards = addItem(s.boards, boardId, design.id, imageIndex)))) {
        haptic('success');
        toast(`Saved to ${board.name}`, {
          kind: 'good',
          body: design.title,
          action: { label: 'View', fn: () => (location.href = href('moodboards', { board: boardId })) },
        });
      }
      rerender();
      return;
    }
    if (e.target.closest('[data-new]')) {
      const name = await promptSheet({ title: 'New mood board', label: 'Board name', placeholder: 'e.g. Living room ideas', confirmLabel: 'Create and save' });
      if (!name) return;
      const id = uid('board');
      const ok = store.update((s) => {
        s.boards = addItem(createBoard(s.boards, name, id), id, design.id, imageIndex);
      });
      if (ok) {
        haptic('success');
        toast(`Saved to ${name}`, { kind: 'good', body: design.title, action: { label: 'View', fn: () => (location.href = href('moodboards', { board: id })) } });
        sheet.close();
      }
    }
  });
}
