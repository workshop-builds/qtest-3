import { describe, expect, it } from 'vitest'
import { PALETTE } from './palette.ts'
import { GRID_SIZE, clearCell, createPixels, getCell, lineCells, paintLine, setCell } from './pixels.ts'

describe('palette', () => {
  it('has exactly 16 distinct colors', () => {
    expect(PALETTE).toHaveLength(16)
    expect(new Set(PALETTE.map((c) => c.hex)).size).toBe(16)
    expect(new Set(PALETTE.map((c) => c.name)).size).toBe(16)
  })
})

describe('pixel model', () => {
  it('starts as an empty 32x32 grid', () => {
    const p = createPixels()
    expect(GRID_SIZE).toBe(32)
    expect(p).toHaveLength(1024)
    expect(p.every((c) => c === null)).toBe(true)
  })

  it('sets a cell without mutating the original', () => {
    const p = createPixels()
    const q = setCell(p, 3, 5, 7)
    expect(getCell(q, 3, 5)).toBe(7)
    expect(getCell(p, 3, 5)).toBeNull()
    expect(q.filter((c) => c !== null)).toHaveLength(1)
  })

  it('clears a cell', () => {
    const q = setCell(createPixels(), 31, 31, 15)
    expect(getCell(q, 31, 31)).toBe(15)
    expect(getCell(clearCell(q, 31, 31), 31, 31)).toBeNull()
  })

  it('ignores out-of-range coordinates', () => {
    const p = createPixels()
    for (const [x, y] of [
      [-1, 0],
      [0, -1],
      [32, 0],
      [0, 32],
      [100, 100],
      [1.5, 2],
      [NaN, 0],
    ]) {
      expect(setCell(p, x, y, 1)).toBe(p)
      expect(clearCell(p, x, y)).toBe(p)
      expect(getCell(p, x, y)).toBeUndefined()
    }
  })

  it('ignores colors outside the palette', () => {
    const p = createPixels()
    expect(setCell(p, 0, 0, 16)).toBe(p)
    expect(setCell(p, 0, 0, -1)).toBe(p)
  })

  it('returns the same grid when nothing changes', () => {
    const p = setCell(createPixels(), 1, 1, 2)
    expect(setCell(p, 1, 1, 2)).toBe(p)
    expect(clearCell(createPixels(), 1, 1)).toEqual(createPixels())
  })
})

describe('lines', () => {
  it('covers every cell between two points, ends included', () => {
    expect(lineCells(0, 0, 3, 0)).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ])
    expect(lineCells(2, 2, 2, 2)).toEqual([[2, 2]])
    const diag = lineCells(5, 5, 0, 0)
    expect(diag).toHaveLength(6)
    expect(diag[0]).toEqual([5, 5])
    expect(diag[5]).toEqual([0, 0])
  })

  it('leaves no gaps on a fast drag', () => {
    const cells = lineCells(0, 0, 20, 7)
    for (let i = 1; i < cells.length; i++) {
      expect(Math.abs(cells[i][0] - cells[i - 1][0])).toBeLessThanOrEqual(1)
      expect(Math.abs(cells[i][1] - cells[i - 1][1])).toBeLessThanOrEqual(1)
    }
  })

  it('paints and erases along a line', () => {
    const painted = paintLine(createPixels(), 0, 0, 4, 0, 9)
    expect([0, 1, 2, 3, 4].map((x) => getCell(painted, x, 0))).toEqual([9, 9, 9, 9, 9])
    const erased = paintLine(painted, 1, 0, 3, 0, null)
    expect([0, 1, 2, 3, 4].map((x) => getCell(erased, x, 0))).toEqual([9, null, null, null, 9])
  })
})
