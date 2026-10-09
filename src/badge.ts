import { frameCells, FRAME_COLOR, FRAMED_SIZE, FRAME_THICKNESS, type FrameId } from './frames.ts'
import { GLYPH_HEIGHT, textPixels, textWidth } from './font.ts'
import { PALETTE } from './palette.ts'
import { GRID_SIZE, type Pixels } from './pixels.ts'

/** Palette index used for the ticker text (White). */
export const TICKER_COLOR = PALETTE.findIndex((c) => c.name === 'White')
/** Empty rows between the framed badge and the ticker. */
export const TICKER_GAP = 3

export interface BadgeCell {
  x: number
  y: number
  /** Palette index. */
  color: number
}

export interface BadgeLayout {
  /** Layout size in cells. */
  width: number
  height: number
  /** Every colored cell: frame, drawing and ticker. Empty cells are not listed. */
  cells: BadgeCell[]
}

/**
 * Lays out the badge (frame ring around the 32x32 drawing) with the ticker centered under it.
 * Everything is on one integer cell grid, so renderers can draw whole-number rectangles.
 * The layout is as wide as the wider of the framed badge and the ticker.
 */
export function layoutBadge(pixels: Pixels, ticker: string, frame: FrameId): BadgeLayout {
  const tw = textWidth(ticker)
  const width = Math.max(FRAMED_SIZE, tw)
  const badgeX = Math.floor((width - FRAMED_SIZE) / 2)
  const cells: BadgeCell[] = []

  for (const [x, y] of frameCells(frame)) cells.push({ x: badgeX + x, y, color: FRAME_COLOR })

  // The drawing sits inside the ring slot even with no frame, so the badge does not move when the frame changes.
  const inset = badgeX + FRAME_THICKNESS
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const color = pixels[y * GRID_SIZE + x]
      if (color !== null) cells.push({ x: inset + x, y: FRAME_THICKNESS + y, color })
    }
  }

  if (tw > 0) {
    const textX = Math.floor((width - tw) / 2)
    const textY = FRAMED_SIZE + TICKER_GAP
    for (const [x, y] of textPixels(ticker)) cells.push({ x: textX + x, y: textY + y, color: TICKER_COLOR })
  }

  const height = tw > 0 ? FRAMED_SIZE + TICKER_GAP + GLYPH_HEIGHT : FRAMED_SIZE
  return { width, height, cells }
}
