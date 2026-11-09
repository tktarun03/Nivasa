/**
 * Pure mood-board operations. Each returns a NEW boards array, so callers can
 * keep the previous value for Undo and tests can check results directly.
 */

export const MAX_BOARD_NAME = 60;

export function cleanName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, MAX_BOARD_NAME);
}

export function createBoard(boards, name, id, now = new Date().toISOString()) {
  const n = cleanName(name) || 'Untitled board';
  return [...boards, { id, name: n, createdAt: now, coverLock: null, items: [] }];
}

export function renameBoard(boards, boardId, name) {
  const n = cleanName(name);
  if (!n) return boards;
  return boards.map((b) => (b.id === boardId ? { ...b, name: n } : b));
}

export function deleteBoard(boards, boardId) {
  return boards.filter((b) => b.id !== boardId);
}

export function hasItem(board, designId, imageIndex = 0) {
  return board.items.some((it) => it.designId === designId && it.imageIndex === imageIndex);
}

export function addItem(boards, boardId, designId, imageIndex = 0, now = new Date().toISOString()) {
  return boards.map((b) => {
    if (b.id !== boardId || hasItem(b, designId, imageIndex)) return b;
    return { ...b, items: [...b.items, { designId, imageIndex, locked: false, addedAt: now }] };
  });
}

/** Locked items are protected: removing them is refused until unlocked. */
export function removeItem(boards, boardId, index) {
  return boards.map((b) => {
    if (b.id !== boardId) return b;
    const it = b.items[index];
    if (!it || it.locked) return b;
    const items = b.items.filter((_, i) => i !== index);
    const coverLock =
      b.coverLock && b.coverLock.designId === it.designId && b.coverLock.imageIndex === it.imageIndex ? null : b.coverLock;
    return { ...b, items, coverLock };
  });
}

/** Re-insert an item at a position (used by Undo). */
export function insertItem(boards, boardId, index, item) {
  return boards.map((b) => {
    if (b.id !== boardId || hasItem(b, item.designId, item.imageIndex)) return b;
    const items = [...b.items];
    items.splice(Math.max(0, Math.min(index, items.length)), 0, item);
    return { ...b, items };
  });
}

export function moveItem(boards, boardId, from, to) {
  return boards.map((b) => {
    if (b.id !== boardId) return b;
    if (from === to || from < 0 || to < 0 || from >= b.items.length || to >= b.items.length) return b;
    const items = [...b.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    return { ...b, items };
  });
}

export function toggleItemLock(boards, boardId, index) {
  return boards.map((b) => {
    if (b.id !== boardId || !b.items[index]) return b;
    const items = b.items.map((it, i) => (i === index ? { ...it, locked: !it.locked } : it));
    return { ...b, items };
  });
}

/** Pin a reference image as the board's cover so adding items never replaces it. */
export function setCoverLock(boards, boardId, item) {
  return boards.map((b) => (b.id === boardId ? { ...b, coverLock: item ? { designId: item.designId, imageIndex: item.imageIndex } : null } : b));
}

/** Cover: the locked cover if set, otherwise the most recently added item. */
export function coverFor(board) {
  if (board.coverLock) return board.coverLock;
  const last = board.items[board.items.length - 1];
  return last ? { designId: last.designId, imageIndex: last.imageIndex } : null;
}
