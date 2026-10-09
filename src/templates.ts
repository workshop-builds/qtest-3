import { PALETTE } from './palette.ts'
import { GRID_SIZE, type Cell, type Pixels } from './pixels.ts'

/** A starter drawing. Templates are plain 32x32 grids of palette indexes, so they stay fully editable. */
export interface Template {
  id: string
  name: string
  pixels: Pixels
}

const color = (name: string): number => {
  const i = PALETTE.findIndex((c) => c.name === name)
  if (i < 0) throw new Error(`Unknown palette color: ${name}`)
  return i
}

const BLACK = color('Black')
const WHITE = color('White')
const GRAY = color('Gray')
const BROWN = color('Brown')
const RED = color('Red')
const ORANGE = color('Orange')
const YELLOW = color('Yellow')
const SKY = color('Sky')
const BLUE = color('Blue')
const NAVY = color('Navy')

type Grid = Cell[]

const blank = (): Grid => Array.from<Cell>({ length: GRID_SIZE * GRID_SIZE }).fill(null)

function put(g: Grid, x: number, y: number, c: Cell): void {
  if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return
  g[y * GRID_SIZE + x] = c
}

/** Fills the inclusive rectangle x0..x1, y0..y1. */
function rect(g: Grid, x0: number, y0: number, x1: number, y1: number, c: Cell): void {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(g, x, y, c)
}

/** Fills every cell whose center lies within r of (cx, cy). */
function disc(g: Grid, cx: number, cy: number, r: number, c: Cell): void {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) put(g, x, y, c)
    }
  }
}

/** Sets a cell and its left-right mirror image. */
function putSym(g: Grid, x: number, y: number, c: Cell): void {
  put(g, x, y, c)
  put(g, GRID_SIZE - 1 - x, y, c)
}

/** Fills a row symmetric around the vertical center line, with the given half width (in cells). */
function symRow(g: Grid, y: number, halfWidth: number, c: Cell): void {
  for (let x = GRID_SIZE / 2 - halfWidth; x < GRID_SIZE / 2 + halfWidth; x++) put(g, x, y, c)
}

/** Gives every non-empty region a 1-cell outline in color c (8 neighbours), on empty cells only. */
function outline(g: Grid, c: Cell): void {
  const snapshot = g.slice()
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (snapshot[y * GRID_SIZE + x] !== null) continue
      let near = false
      for (let dy = -1; dy <= 1 && !near; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) continue
          if (snapshot[ny * GRID_SIZE + nx] !== null) {
            near = true
            break
          }
        }
      }
      if (near) g[y * GRID_SIZE + x] = c
    }
  }
}

/** True when (px, py) is inside the polygon (even-odd rule). */
function inPolygon(px: number, py: number, pts: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function fillStar(g: Grid, cx: number, cy: number, outer: number, inner: number, c: Cell): void {
  const pts: [number, number][] = []
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 === 0 ? outer : inner
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (inPolygon(x + 0.5, y + 0.5, pts)) put(g, x, y, c)
    }
  }
}

function robotHead(): Grid {
  const g = blank()
  rect(g, 15, 4, 16, 8, GRAY) // antenna
  disc(g, 16, 4, 2.4, RED)
  rect(g, 3, 14, 5, 22, NAVY) // ears
  rect(g, 26, 14, 28, 22, NAVY)
  rect(g, 6, 9, 25, 28, GRAY) // head
  rect(g, 6, 9, 25, 10, WHITE) // top highlight
  rect(g, 9, 13, 14, 18, NAVY) // eyes
  rect(g, 17, 13, 22, 18, NAVY)
  rect(g, 10, 14, 13, 17, SKY)
  rect(g, 18, 14, 21, 17, SKY)
  rect(g, 11, 15, 12, 16, WHITE)
  rect(g, 19, 15, 20, 16, WHITE)
  rect(g, 10, 22, 21, 25, BLACK) // mouth
  for (const x of [13, 16, 19]) rect(g, x, 22, x, 25, GRAY)
  outline(g, BLACK)
  return g
}

function rocket(): Grid {
  const g = blank()
  // Fins first, so the body draws over their inner edge.
  for (let y = 17; y <= 26; y++) {
    const xmin = 11 - Math.min(5, y - 17)
    for (let x = xmin; x <= 10; x++) putSym(g, x, y, RED)
  }
  // Body: a tapered nose over straight sides.
  const halfWidths = [1, 2, 3, 4, 4, 5]
  for (let y = 3; y <= 23; y++) symRow(g, y, y - 3 < halfWidths.length ? halfWidths[y - 3] : 5, WHITE)
  for (let y = 3; y <= 8; y++) symRow(g, y, halfWidths[y - 3], RED) // red nose
  rect(g, 11, 20, 12, 23, GRAY) // shaded side
  rect(g, 19, 20, 20, 23, GRAY)
  disc(g, 16, 14, 3.4, NAVY) // window
  disc(g, 16, 14, 2.4, SKY)
  put(g, 15, 13, WHITE)
  rect(g, 12, 24, 19, 24, GRAY) // nozzle
  const flame = [4, 4, 3, 3, 2, 2, 1]
  flame.forEach((hw, i) => {
    const y = 25 + i
    symRow(g, y, hw, ORANGE)
    if (hw > 2) symRow(g, y, hw - 2, YELLOW)
  })
  outline(g, BLACK)
  return g
}

function flame(): Grid {
  const g = blank()
  const hw = [1, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9, 9, 9, 8, 8, 7, 6, 4, 2]
  hw.forEach((w, i) => {
    const y = 3 + i
    symRow(g, y, w, RED)
    if (i >= 5 && w - 2 > 0) symRow(g, y, w - 2, ORANGE)
    if (i >= 13 && w - 4 > 0) symRow(g, y, w - 4, YELLOW)
    if (i >= 18 && w - 6 > 0) symRow(g, y, w - 6, WHITE)
  })
  outline(g, BLACK)
  return g
}

function star(): Grid {
  const g = blank()
  fillStar(g, 16, 17, 14, 5.8, ORANGE)
  fillStar(g, 16, 17, 12, 4.6, YELLOW)
  // A small highlight on the upper left arm.
  rect(g, 14, 12, 15, 14, WHITE)
  outline(g, BLACK)
  return g
}

function coin(): Grid {
  const g = blank()
  disc(g, 16, 16, 14, BLACK)
  disc(g, 16, 16, 13, ORANGE)
  disc(g, 16, 16, 11.4, YELLOW)
  disc(g, 16, 16, 8.6, ORANGE)
  disc(g, 16, 16, 7.6, YELLOW)
  // A "$" mark.
  rect(g, 15, 8, 16, 23, BROWN)
  rect(g, 12, 11, 19, 12, BROWN)
  rect(g, 12, 11, 13, 15, BROWN)
  rect(g, 12, 15, 19, 16, BROWN)
  rect(g, 18, 16, 19, 20, BROWN)
  rect(g, 12, 19, 19, 20, BROWN)
  rect(g, 8, 8, 9, 10, WHITE) // shine
  return g
}

function wrench(): Grid {
  const g = blank()
  // Handle: cells near the line from (7, 25) to (21, 11).
  const [ax, ay, bx, by] = [7, 25, 21, 11]
  const len = Math.hypot(bx - ax, by - ay)
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const px = x + 0.5 - ax
      const py = y + 0.5 - ay
      const t = (px * (bx - ax) + py * (by - ay)) / len ** 2
      const d = Math.abs(px * (by - ay) - py * (bx - ax)) / len
      if (d > 2.2 || t < -0.05 || t > 1) continue
      put(g, x, y, t < 0.38 ? BLUE : GRAY)
    }
  }
  // Head with a jaw notch opening to the upper right.
  disc(g, 23, 9, 6.2, GRAY)
  const s = Math.SQRT1_2
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const px = x + 0.5 - 23
      const py = y + 0.5 - 9
      const along = px * s - py * s // toward the upper right
      const across = px * s + py * s
      if (along >= 1.5 && Math.abs(across) <= 2.4) put(g, x, y, null)
    }
  }
  disc(g, 20, 12, 1.2, WHITE) // shine where head meets handle
  outline(g, BLACK)
  return g
}

const make = (id: string, name: string, build: () => Grid): Template => ({ id, name, pixels: Object.freeze(build()) })

export const TEMPLATES: readonly Template[] = [
  make('robot', 'Robot head', robotHead),
  make('rocket', 'Rocket', rocket),
  make('flame', 'Flame', flame),
  make('star', 'Star', star),
  make('coin', 'Coin', coin),
  make('wrench', 'Wrench', wrench),
]
