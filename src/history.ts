import type { Pixels } from './pixels.ts'

/** Undo history over whole-grid snapshots (grids are immutable, so snapshots share nothing mutable). */
export interface History {
  past: readonly Pixels[]
  present: Pixels
  future: readonly Pixels[]
  /** True between beginStroke and endStroke: edits then join one undo step. */
  stroking: boolean
  /** True once the open stroke has made its undo step. */
  strokeStarted: boolean
}

/** Upper bound on undo steps kept in memory (32x32 snapshots are small, this is generous). */
export const MAX_HISTORY = 200

export function createHistory(present: Pixels): History {
  return { past: [], present, future: [], stroking: false, strokeStarted: false }
}

/** A new undoable step. No change (same grid) adds nothing. A new edit clears redo. */
export function commit(h: History, next: Pixels): History {
  if (next === h.present) return h
  return { ...h, past: [...h.past, h.present].slice(-MAX_HISTORY), present: next, future: [] }
}

export function beginStroke(h: History): History {
  return { ...h, stroking: true, strokeStarted: false }
}

/** Applies an edit. Inside a stroke, the first change makes an undo step and later ones join it. */
export function edit(h: History, next: Pixels): History {
  if (next === h.present) return h
  if (h.stroking && h.strokeStarted) return { ...h, present: next }
  const c = commit(h, next)
  return h.stroking ? { ...c, strokeStarted: true } : c
}

export function endStroke(h: History): History {
  return h.stroking ? { ...h, stroking: false, strokeStarted: false } : h
}

export function canUndo(h: History): boolean {
  return h.past.length > 0
}

export function canRedo(h: History): boolean {
  return h.future.length > 0
}

export function undo(h: History): History {
  if (!canUndo(h)) return h
  return {
    ...h,
    past: h.past.slice(0, -1),
    present: h.past[h.past.length - 1],
    future: [h.present, ...h.future],
    stroking: false,
    strokeStarted: false,
  }
}

export function redo(h: History): History {
  if (!canRedo(h)) return h
  return {
    ...h,
    past: [...h.past, h.present],
    present: h.future[0],
    future: h.future.slice(1),
    stroking: false,
    strokeStarted: false,
  }
}
