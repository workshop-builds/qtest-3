import { PALETTE } from './palette.ts'

/** Side length of the square drawing grid. */
export const GRID_SIZE = 32

/** A cell is a palette index (0 to 15) or null when empty. */
export type Cell = number | null

/** 32x32 cells in row-major order (index = y * GRID_SIZE + x). Treated as immutable. */
export type Pixels = readonly Cell[]

export function createPixels(): Pixels {
  return Array.from<Cell>({ length: GRID_SIZE * GRID_SIZE }).fill(null)
}

export function inRange(x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE
}

/** Returns the cell at (x, y), or undefined when out of range. */
export function getCell(pixels: Pixels, x: number, y: number): Cell | undefined {
  return inRange(x, y) ? pixels[y * GRID_SIZE + x] : undefined
}

/**
 * Returns a grid with (x, y) set to a palette index, or cleared when value is null.
 * Out-of-range coordinates or an invalid palette index leave the grid untouched
 * (the same array is returned, so callers can skip re-rendering).
 */
export function setCell(pixels: Pixels, x: number, y: number, value: Cell): Pixels {
  if (!inRange(x, y)) return pixels
  if (value !== null && !(Number.isInteger(value) && value >= 0 && value < PALETTE.length)) return pixels
  const i = y * GRID_SIZE + x
  if (pixels[i] === value) return pixels
  const next = pixels.slice()
  next[i] = value
  return next
}

export function clearCell(pixels: Pixels, x: number, y: number): Pixels {
  return setCell(pixels, x, y, null)
}

/** Every cell on the straight line from (x0, y0) to (x1, y1), both ends included (Bresenham). */
export function lineCells(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const cells: [number, number][] = []
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let x = x0
  let y = y0
  for (;;) {
    cells.push([x, y])
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
  return cells
}

/** Sets (or clears, for null) every cell on a line. */
export function paintLine(pixels: Pixels, x0: number, y0: number, x1: number, y1: number, value: Cell): Pixels {
  let next = pixels
  for (const [x, y] of lineCells(x0, y0, x1, y1)) next = setCell(next, x, y, value)
  return next
}
