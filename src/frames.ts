import { PALETTE } from './palette.ts'
import { GRID_SIZE } from './pixels.ts'

export type FrameId = 'none' | 'square' | 'rounded'

export const FRAMES: readonly { id: FrameId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
]

/** Thickness of the frame ring, in badge cells. The ring sits outside the 32x32 drawing. */
export const FRAME_THICKNESS = 2
/** Side of the framed badge in cells: the drawing plus the ring on every side. */
export const FRAMED_SIZE = GRID_SIZE + 2 * FRAME_THICKNESS
/** Palette index used to draw frames (Yellow). */
export const FRAME_COLOR = PALETTE.findIndex((c) => c.name === 'Yellow')

export function isFrameId(value: unknown): value is FrameId {
  return FRAMES.some((f) => f.id === value)
}

/**
 * The cells of a frame on the FRAMED_SIZE x FRAMED_SIZE square, as [x, y] pairs.
 * 'none' has no cells. 'square' is a plain ring. 'rounded' is the same ring with
 * its four corner cells cut off, which gives a stepped pixel-art curve.
 */
export function frameCells(frame: FrameId): [number, number][] {
  if (frame === 'none') return []
  const last = FRAMED_SIZE - 1
  const out: [number, number][] = []
  for (let y = 0; y < FRAMED_SIZE; y++) {
    for (let x = 0; x < FRAMED_SIZE; x++) {
      const cx = Math.min(x, last - x)
      const cy = Math.min(y, last - y)
      if (cx >= FRAME_THICKNESS && cy >= FRAME_THICKNESS) continue
      if (frame === 'rounded' && cx + cy <= 1) continue
      out.push([x, y])
    }
  }
  return out
}
