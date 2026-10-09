import { memo, useRef, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { PALETTE } from './palette.ts'
import { GRID_SIZE, type Cell, type Pixels } from './pixels.ts'

export type Point = readonly [number, number]

interface Props {
  pixels: Pixels
  /** Called for a press (from === to) and for each pointer move; the line between the points should be painted. */
  onStroke: (from: Point, to: Point) => void
  /** A stroke begins (pointer down, or a synthetic click) and ends. One stroke is one undo step. */
  onStrokeStart?: () => void
  onStrokeEnd?: () => void
}

const CellView = memo(function CellView({ x, y, value }: { x: number; y: number; value: Cell }) {
  return (
    <div
      data-testid={`cell-${x}-${y}`}
      data-x={x}
      data-y={y}
      data-color={value === null ? '' : String(value)}
      style={value === null ? undefined : { backgroundColor: PALETTE[value].hex }}
      className={value === null ? 'bg-neutral-900' : undefined}
    />
  )
})

/** The cell under the pointer: from coordinates when laid out, else from the event target (jsdom has no layout). */
function cellAt(e: ReactPointerEvent<HTMLElement> | ReactMouseEvent<HTMLElement>, grid: HTMLElement): Point | null {
  const rect = grid.getBoundingClientRect()
  if (rect.width > 0 && rect.height > 0) {
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * GRID_SIZE)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * GRID_SIZE)
    return [Math.min(GRID_SIZE - 1, Math.max(0, x)), Math.min(GRID_SIZE - 1, Math.max(0, y))]
  }
  const t = e.target as HTMLElement
  if (t.dataset?.x !== undefined && t.dataset.y !== undefined) return [Number(t.dataset.x), Number(t.dataset.y)]
  return null
}

export function PixelGrid({ pixels, onStroke, onStrokeStart, onStrokeEnd }: Props) {
  const last = useRef<Point | null>(null)

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const p = cellAt(e, e.currentTarget)
    if (!p) return
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      // Capture is a nicety (keeps the drag going outside the grid); painting works without it.
    }
    if (last.current) onStrokeEnd?.()
    last.current = p
    onStrokeStart?.()
    onStroke(p, p)
  }
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const from = last.current
    if (!from) return
    const p = cellAt(e, e.currentTarget)
    if (!p || (p[0] === from[0] && p[1] === from[1])) return
    last.current = p
    onStroke(from, p)
  }
  const end = () => {
    if (!last.current) return
    last.current = null
    onStrokeEnd?.()
  }

  return (
    <div
      role="group"
      aria-label="Pixel grid, 32 by 32"
      data-testid="pixel-grid"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onClick={(e) => {
        // Real clicks follow a pointerdown that already painted (detail >= 1). A click with detail 0
        // is synthetic (assistive tech, tests), so paint it here.
        if (e.detail !== 0) return
        const p = cellAt(e, e.currentTarget)
        if (p) {
          onStrokeStart?.()
          onStroke(p, p)
          onStrokeEnd?.()
        }
      }}
      style={{
        touchAction: 'none',
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
        gap: '1px',
        aspectRatio: '1 / 1',
        width: '100%',
        userSelect: 'none',
      }}
      className="cursor-crosshair border border-neutral-600 bg-neutral-700"
    >
      {pixels.map((value, i) => (
        <CellView key={i} x={i % GRID_SIZE} y={Math.floor(i / GRID_SIZE)} value={value} />
      ))}
    </div>
  )
}
