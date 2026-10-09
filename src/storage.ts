import { isFrameId, type FrameId } from './frames.ts'
import { PALETTE } from './palette.ts'
import { createPixels, GRID_SIZE, type Cell, type Pixels } from './pixels.ts'
import { sanitizeTicker } from './ticker.ts'

/** Everything that is saved in the browser: the drawing, the ticker and the frame. */
export interface SavedBadge {
  pixels: Pixels
  ticker: string
  frame: FrameId
}

export const STORAGE_KEY = 'pixel-badge:v1'
const VERSION = 1

export function emptyBadge(): SavedBadge {
  return { pixels: createPixels(), ticker: '', frame: 'none' }
}

function isCell(v: unknown): v is Cell {
  return v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < PALETTE.length)
}

/** Turns stored text into a badge. Anything missing, malformed or out of range gives null. */
export function parseSaved(text: string | null): SavedBadge | null {
  if (!text) return null
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>
  if (d.v !== VERSION) return null
  if (!Array.isArray(d.pixels) || d.pixels.length !== GRID_SIZE * GRID_SIZE || !d.pixels.every(isCell)) return null
  if (typeof d.ticker !== 'string' || !isFrameId(d.frame)) return null
  return { pixels: d.pixels as Cell[], ticker: sanitizeTicker(d.ticker), frame: d.frame }
}

export function serializeBadge(badge: SavedBadge): string {
  return JSON.stringify({ v: VERSION, pixels: badge.pixels, ticker: badge.ticker, frame: badge.frame })
}

/** Reads the saved badge. Missing, corrupt or unreadable storage gives an empty badge and never throws. */
export function loadBadge(storage?: Pick<Storage, 'getItem'>): SavedBadge {
  try {
    const s = storage ?? globalThis.localStorage
    return parseSaved(s.getItem(STORAGE_KEY)) ?? emptyBadge()
  } catch {
    return emptyBadge()
  }
}

/** Saves the badge. Returns false (and does not throw) when storage is full, blocked or missing. */
export function saveBadge(badge: SavedBadge, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    const s = storage ?? globalThis.localStorage
    s.setItem(STORAGE_KEY, serializeBadge(badge))
    return true
  } catch {
    return false
  }
}
