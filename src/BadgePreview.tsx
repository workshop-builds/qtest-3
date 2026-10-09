import { useMemo } from 'react'
import { layoutBadge } from './badge.ts'
import type { FrameId } from './frames.ts'
import { PALETTE } from './palette.ts'
import type { Pixels } from './pixels.ts'

/** Live preview of the badge with its frame and the ticker in the bundled pixel font. */
export function BadgePreview({ pixels, ticker, frame }: { pixels: Pixels; ticker: string; frame: FrameId }) {
  const layout = useMemo(() => layoutBadge(pixels, ticker, frame), [pixels, ticker, frame])
  return (
    <svg
      role="img"
      aria-label={ticker ? `Badge preview with ticker ${ticker}, ${frame} frame` : `Badge preview, ${frame} frame`}
      data-testid="badge-preview"
      data-frame={frame}
      data-ticker={ticker}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      shapeRendering="crispEdges"
      className="mx-auto block max-h-80 w-full max-w-xs rounded border border-neutral-700 bg-neutral-950 p-2"
    >
      {layout.cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={1} height={1} fill={PALETTE[c.color].hex} />
      ))}
    </svg>
  )
}
