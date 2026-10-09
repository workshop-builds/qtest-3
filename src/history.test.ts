import { describe, expect, it } from 'vitest'
import { beginStroke, canRedo, canUndo, commit, createHistory, edit, endStroke, redo, undo } from './history.ts'
import { GRID_SIZE, createPixels, floodFill, getCell, mirrorPixels, setCell } from './pixels.ts'

describe('floodFill', () => {
  it('fills the whole empty grid from any cell', () => {
    const out = floodFill(createPixels(), 5, 5, 3)
    expect(out.every((c) => c === 3)).toBe(true)
  })

  it('stops at a boundary of another color (4-directional, no diagonal leak)', () => {
    let p = createPixels()
    // A wall across column 10.
    for (let y = 0; y < GRID_SIZE; y++) p = setCell(p, 10, y, 1)
    const out = floodFill(p, 0, 0, 2)
    expect(getCell(out, 9, 31)).toBe(2)
    expect(getCell(out, 10, 0)).toBe(1)
    expect(getCell(out, 11, 0)).toBeNull()
  })

  it('does not leak through a diagonal gap', () => {
    let p = createPixels()
    p = setCell(p, 1, 0, 1)
    p = setCell(p, 0, 1, 1)
    const out = floodFill(p, 0, 0, 2)
    expect(getCell(out, 0, 0)).toBe(2)
    expect(getCell(out, 1, 1)).toBeNull()
  })

  it('replaces a region of a painted color, not just empty', () => {
    let p = setCell(createPixels(), 3, 3, 1)
    p = setCell(p, 4, 3, 1)
    const out = floodFill(p, 3, 3, 7)
    expect(getCell(out, 3, 3)).toBe(7)
    expect(getCell(out, 4, 3)).toBe(7)
    expect(getCell(out, 5, 3)).toBeNull()
  })

  it('can fill with empty (erase a region)', () => {
    const p = setCell(createPixels(), 3, 3, 1)
    expect(getCell(floodFill(p, 3, 3, null), 3, 3)).toBeNull()
  })

  it('is a no-op (same grid) when the color already matches', () => {
    const p = setCell(createPixels(), 3, 3, 1)
    expect(floodFill(p, 3, 3, 1)).toBe(p)
    const empty = createPixels()
    expect(floodFill(empty, 0, 0, null)).toBe(empty)
  })

  it('ignores out-of-range starts and invalid colors', () => {
    const p = createPixels()
    expect(floodFill(p, -1, 0, 1)).toBe(p)
    expect(floodFill(p, 0, 32, 1)).toBe(p)
    expect(floodFill(p, 0, 0, 99)).toBe(p)
  })
})

describe('mirrorPixels', () => {
  it('flips left to right', () => {
    const p = setCell(createPixels(), 0, 4, 5)
    const out = mirrorPixels(p)
    expect(getCell(out, 31, 4)).toBe(5)
    expect(getCell(out, 0, 4)).toBeNull()
  })

  it('applied twice gives back the original', () => {
    let p = createPixels()
    p = setCell(p, 0, 0, 1)
    p = setCell(p, 3, 7, 2)
    p = setCell(p, 30, 20, 9)
    expect(mirrorPixels(mirrorPixels(p))).toEqual(p)
  })
})

describe('history', () => {
  const a = setCell(createPixels(), 0, 0, 1)
  const b = setCell(a, 1, 0, 1)
  const c = setCell(b, 2, 0, 1)

  it('starts with nothing to undo or redo', () => {
    const h = createHistory(createPixels())
    expect(canUndo(h)).toBe(false)
    expect(canRedo(h)).toBe(false)
    expect(undo(h)).toBe(h)
    expect(redo(h)).toBe(h)
  })

  it('steps back and forward through commits', () => {
    let h = createHistory(createPixels())
    h = commit(h, a)
    h = commit(h, b)
    expect(canUndo(h)).toBe(true)
    h = undo(h)
    expect(h.present).toBe(a)
    expect(canRedo(h)).toBe(true)
    h = undo(h)
    expect(h.present).toEqual(createPixels())
    expect(canUndo(h)).toBe(false)
    h = redo(redo(h))
    expect(h.present).toBe(b)
    expect(canRedo(h)).toBe(false)
  })

  it('a new edit clears redo', () => {
    let h = commit(commit(createHistory(createPixels()), a), b)
    h = undo(h)
    expect(canRedo(h)).toBe(true)
    h = commit(h, c)
    expect(canRedo(h)).toBe(false)
  })

  it('a no-op commit adds no step', () => {
    const h = createHistory(createPixels())
    expect(commit(h, h.present)).toBe(h)
  })

  it('one stroke is one undo step', () => {
    let h = createHistory(createPixels())
    h = beginStroke(h)
    h = edit(h, a)
    h = edit(h, b)
    h = edit(h, c)
    h = endStroke(h)
    expect(h.past).toHaveLength(1)
    h = undo(h)
    expect(h.present).toEqual(createPixels())
    expect(canUndo(h)).toBe(false)
    h = redo(h)
    expect(h.present).toBe(c)
  })

  it('a stroke that changes nothing adds no step, and the next stroke is separate', () => {
    let h = createHistory(createPixels())
    h = endStroke(edit(beginStroke(h), h.present))
    expect(canUndo(h)).toBe(false)
    h = endStroke(edit(beginStroke(h), a))
    h = endStroke(edit(beginStroke(h), b))
    expect(h.past).toHaveLength(2)
  })

  it('a stroke after undo clears redo', () => {
    let h = commit(createHistory(createPixels()), a)
    h = undo(h)
    h = endStroke(edit(beginStroke(h), b))
    expect(canRedo(h)).toBe(false)
  })
})
