import { describe, it, expect } from 'vitest';
import {
  createBoard, renameBoard, deleteBoard, addItem, removeItem, insertItem, moveItem, toggleItemLock, setCoverLock, coverFor, cleanName,
} from '../../src/js/storage/boards.js';

const NOW = '2026-11-08T00:00:00.000Z';
const base = () => {
  let b = createBoard([], 'Kitchen ideas', 'b1', NOW);
  b = addItem(b, 'b1', 'd1', 0, NOW);
  b = addItem(b, 'b1', 'd2', 0, NOW);
  b = addItem(b, 'b1', 'd3', 1, NOW);
  return b;
};

describe('mood boards', () => {
  it('creates, renames and deletes', () => {
    let b = createBoard([], '  Living   room ', 'x', NOW);
    expect(b[0].name).toBe('Living room');
    b = renameBoard(b, 'x', 'Lounge');
    expect(b[0].name).toBe('Lounge');
    expect(renameBoard(b, 'x', '   ')[0].name).toBe('Lounge');
    expect(deleteBoard(b, 'x')).toHaveLength(0);
  });

  it('caps names and defaults empty names', () => {
    expect(cleanName('a'.repeat(100))).toHaveLength(60);
    expect(createBoard([], '', 'y', NOW)[0].name).toBe('Untitled board');
  });

  it('does not add the same image twice', () => {
    const b = addItem(base(), 'b1', 'd1', 0, NOW);
    expect(b[0].items).toHaveLength(3);
  });

  it('removes and restores an item at the same position (undo)', () => {
    const b = base();
    const removed = b[0].items[1];
    const after = removeItem(b, 'b1', 1);
    expect(after[0].items.map((i) => i.designId)).toEqual(['d1', 'd3']);
    const restored = insertItem(after, 'b1', 1, removed);
    expect(restored[0].items.map((i) => i.designId)).toEqual(['d1', 'd2', 'd3']);
  });

  it('refuses to remove a locked item', () => {
    const locked = toggleItemLock(base(), 'b1', 0);
    expect(locked[0].items[0].locked).toBe(true);
    expect(removeItem(locked, 'b1', 0)[0].items).toHaveLength(3);
  });

  it('reorders items', () => {
    const b = moveItem(base(), 'b1', 2, 0);
    expect(b[0].items.map((i) => i.designId)).toEqual(['d3', 'd1', 'd2']);
    expect(moveItem(base(), 'b1', 0, 9)[0].items.map((i) => i.designId)).toEqual(['d1', 'd2', 'd3']);
  });

  it('keeps a locked cover when new items are added', () => {
    let b = setCoverLock(base(), 'b1', { designId: 'd1', imageIndex: 0 });
    b = addItem(b, 'b1', 'd9', 0, NOW);
    expect(coverFor(b[0])).toEqual({ designId: 'd1', imageIndex: 0 });
    // Without a lock the cover follows the newest item
    expect(coverFor(addItem(base(), 'b1', 'd9', 0, NOW)[0])).toEqual({ designId: 'd9', imageIndex: 0 });
  });

  it('clears the cover lock when its item is removed', () => {
    let b = setCoverLock(base(), 'b1', { designId: 'd2', imageIndex: 0 });
    b = removeItem(b, 'b1', 1);
    expect(b[0].coverLock).toBeNull();
  });
});
