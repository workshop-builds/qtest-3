import { useEffect, useState } from 'react'
import { BadgePreview } from './BadgePreview.tsx'
import { FRAMES, type FrameId } from './frames.ts'
import { PixelGrid, type Point } from './PixelGrid.tsx'
import { MAX_TICKER_LENGTH, sanitizeTicker } from './ticker.ts'
import { PALETTE } from './palette.ts'
import { loadBadge, saveBadge } from './storage.ts'
import { TEMPLATES } from './templates.ts'
import { downloadCanvas, exportName, renderBadgeCanvas, renderBannerCanvas } from './export.ts'
import { floodFill, mirrorPixels, paintLine } from './pixels.ts'
import {
  beginStroke,
  canRedo,
  canUndo,
  commit,
  createHistory,
  edit,
  endStroke,
  redo,
  undo,
  type History,
} from './history.ts'

export type Mode = 'draw' | 'erase' | 'fill'

const MODES: { id: Mode; label: string }[] = [
  { id: 'draw', label: 'Draw' },
  { id: 'erase', label: 'Erase' },
  { id: 'fill', label: 'Fill' },
]

const ACTION_CLASS =
  'min-h-11 min-w-11 rounded border-2 border-neutral-500 bg-neutral-900 px-3 font-bold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-40'

export function Editor() {
  const [saved] = useState(loadBadge)
  const [history, setHistory] = useState<History>(() => createHistory(saved.pixels))
  const [color, setColor] = useState(4)
  const [mode, setMode] = useState<Mode>('draw')
  const [ticker, setTicker] = useState(saved.ticker)
  const [frame, setFrame] = useState<FrameId>(saved.frame)
  const [exportError, setExportError] = useState('')
  const pixels = history.present

  // Save the drawing, ticker and frame to this browser on every change.
  useEffect(() => {
    saveBadge({ pixels, ticker, frame })
  }, [pixels, ticker, frame])

  const download = (kind: 'badge' | 'banner') => {
    const render = kind === 'badge' ? renderBadgeCanvas : renderBannerCanvas
    setExportError('')
    downloadCanvas(render(pixels, ticker, frame), exportName(kind, ticker)).catch(() =>
      setExportError('Could not create the PNG in this browser.'),
    )
  }

  const stroke = (from: Point, to: Point) => {
    if (mode === 'fill') {
      // Fill acts on the press only; dragging in fill mode does nothing.
      if (from[0] !== to[0] || from[1] !== to[1]) return
      setHistory((h) => edit(h, floodFill(h.present, from[0], from[1], color)))
      return
    }
    const value = mode === 'draw' ? color : null
    setHistory((h) => edit(h, paintLine(h.present, from[0], from[1], to[0], to[1], value)))
  }

  return (
    <section aria-labelledby="editor-heading" className="space-y-3">
      <h2 id="editor-heading" className="sr-only">
        Editor
      </h2>

      <PixelGrid
        pixels={pixels}
        onStroke={stroke}
        onStrokeStart={() => setHistory(beginStroke)}
        onStrokeEnd={() => setHistory(endStroke)}
      />

      <div role="group" aria-label="Templates" className="space-y-1">
        <p className="text-sm font-bold text-white">Start from a template</p>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={ACTION_CLASS}
              onClick={() => setHistory((h) => commit(h, t.pixels))}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div role="group" aria-label="History and mirror" className="grid grid-cols-3 gap-2">
        <button type="button" className={ACTION_CLASS} disabled={!canUndo(history)} onClick={() => setHistory(undo)}>
          Undo
        </button>
        <button type="button" className={ACTION_CLASS} disabled={!canRedo(history)} onClick={() => setHistory(redo)}>
          Redo
        </button>
        <button
          type="button"
          className={ACTION_CLASS}
          onClick={() => setHistory((h) => commit(h, mirrorPixels(h.present)))}
        >
          Mirror
        </button>
      </div>

      <div role="group" aria-label="Tool" className="grid grid-cols-3 gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`min-h-11 min-w-11 rounded border-2 px-3 font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
              mode === m.id
                ? 'border-amber-300 bg-amber-300 text-black'
                : 'border-neutral-500 bg-neutral-900 text-white'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div
        role="group"
        aria-label="Palette"
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))' }}
      >
        {PALETTE.map((c, i) => {
          const selected = i === color
          return (
            <button
              key={c.hex}
              type="button"
              aria-label={c.name}
              aria-pressed={selected}
              data-testid={`swatch-${i}`}
              onClick={() => {
                setColor(i)
                setMode('draw')
              }}
              style={{ backgroundColor: c.hex }}
              className={`relative h-11 min-h-11 w-full min-w-11 rounded border-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
                selected ? 'border-white ring-4 ring-amber-300' : 'border-neutral-600'
              }`}
            >
              {selected && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 m-auto flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-black text-[10px] leading-none text-white"
                >
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="space-y-2 border-t border-neutral-700 pt-3">
        <label htmlFor="ticker-input" className="block font-bold text-white">
          Ticker
        </label>
        <input
          id="ticker-input"
          type="text"
          value={ticker}
          maxLength={MAX_TICKER_LENGTH}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Up to 10: A-Z 0-9 $"
          onChange={(e) => setTicker(sanitizeTicker(e.target.value))}
          className="min-h-11 w-full rounded border-2 border-neutral-500 bg-neutral-900 px-3 font-mono text-lg text-white uppercase focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        />
        <div role="group" aria-label="Frame" className="grid grid-cols-3 gap-2">
          {FRAMES.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={frame === f.id}
              onClick={() => setFrame(f.id)}
              className={`min-h-11 min-w-11 rounded border-2 px-3 font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
                frame === f.id
                  ? 'border-amber-300 bg-amber-300 text-black'
                  : 'border-neutral-500 bg-neutral-900 text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <BadgePreview pixels={pixels} ticker={ticker} frame={frame} />
        <div role="group" aria-label="Export" className="grid grid-cols-2 gap-2">
          <button type="button" className={ACTION_CLASS} onClick={() => download('badge')}>
            Download badge
          </button>
          <button type="button" className={ACTION_CLASS} onClick={() => download('banner')}>
            Download banner
          </button>
        </div>
        <p className="text-sm text-neutral-300">PNG files are made in your browser. Nothing is uploaded.</p>
        {exportError && (
          <p role="alert" className="text-sm font-bold text-red-300">
            {exportError}
          </p>
        )}
      </div>
    </section>
  )
}
