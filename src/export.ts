import { layoutBadge, TICKER_COLOR, type BadgeCell } from './badge.ts'
import { FRAMED_SIZE, type FrameId } from './frames.ts'
import { GLYPH_HEIGHT, textPixels, textWidth } from './font.ts'
import { PALETTE } from './palette.ts'
import type { Pixels } from './pixels.ts'

export const BADGE_EXPORT_SIZE = 512
export const BANNER_WIDTH = 1500
export const BANNER_HEIGHT = 500
/** Solid background of both PNGs, so white text and Black cells stay visible. */
export const EXPORT_BACKGROUND = '#111111'

const BANNER_BADGE_SCALE = 12
const BANNER_MARGIN = 32
const BANNER_TEXT_MAX_SCALE = 20

export type CanvasFactory = (width: number, height: number) => HTMLCanvasElement

export const domCanvas: CanvasFactory = (width, height) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available in this browser')
  // Pixels are drawn as whole-number rectangles; smoothing off keeps every edge hard.
  ctx.imageSmoothingEnabled = false
  return ctx
}

function fillBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = EXPORT_BACKGROUND
  ctx.fillRect(0, 0, width, height)
}

/** Draws cells as `scale` x `scale` solid rectangles at integer positions. */
function drawCells(ctx: CanvasRenderingContext2D, cells: readonly BadgeCell[], scale: number, ox: number, oy: number) {
  for (const c of cells) {
    ctx.fillStyle = PALETTE[c.color].hex
    ctx.fillRect(ox + c.x * scale, oy + c.y * scale, scale, scale)
  }
}

/** Where the badge export puts the layout: the largest whole-number cell size that fits, centered. */
export function badgeExportGeometry(layoutWidth: number, layoutHeight: number) {
  const scale = Math.max(1, Math.floor(Math.min(BADGE_EXPORT_SIZE / layoutWidth, BADGE_EXPORT_SIZE / layoutHeight)))
  const ox = Math.floor((BADGE_EXPORT_SIZE - layoutWidth * scale) / 2)
  const oy = Math.floor((BADGE_EXPORT_SIZE - layoutHeight * scale) / 2)
  return { scale, ox, oy }
}

/** 512x512: the framed badge with the ticker under it, on a solid background. */
export function renderBadgeCanvas(
  pixels: Pixels,
  ticker: string,
  frame: FrameId,
  createCanvas: CanvasFactory = domCanvas,
): HTMLCanvasElement {
  const canvas = createCanvas(BADGE_EXPORT_SIZE, BADGE_EXPORT_SIZE)
  const ctx = context(canvas)
  fillBackground(ctx, BADGE_EXPORT_SIZE, BADGE_EXPORT_SIZE)
  const layout = layoutBadge(pixels, ticker, frame)
  const { scale, ox, oy } = badgeExportGeometry(layout.width, layout.height)
  drawCells(ctx, layout.cells, scale, ox, oy)
  return canvas
}

/** Where the banner puts the ticker: whole-number scale, left edge and top edge. */
export function bannerTickerGeometry(ticker: string) {
  const tw = textWidth(ticker)
  const left = BANNER_MARGIN + FRAMED_SIZE * BANNER_BADGE_SCALE + BANNER_MARGIN
  const available = BANNER_WIDTH - BANNER_MARGIN - left
  const scale = tw === 0 ? 1 : Math.max(1, Math.min(BANNER_TEXT_MAX_SCALE, Math.floor(available / tw)))
  const x = left + Math.floor((available - tw * scale) / 2)
  const y = Math.floor((BANNER_HEIGHT - GLYPH_HEIGHT * scale) / 2)
  return { scale, x, y }
}

/** 1500x500: the framed badge on the left and the ticker in the pixel font on the right. */
export function renderBannerCanvas(
  pixels: Pixels,
  ticker: string,
  frame: FrameId,
  createCanvas: CanvasFactory = domCanvas,
): HTMLCanvasElement {
  const canvas = createCanvas(BANNER_WIDTH, BANNER_HEIGHT)
  const ctx = context(canvas)
  fillBackground(ctx, BANNER_WIDTH, BANNER_HEIGHT)
  const badge = layoutBadge(pixels, '', frame)
  const badgeY = Math.floor((BANNER_HEIGHT - FRAMED_SIZE * BANNER_BADGE_SCALE) / 2)
  drawCells(ctx, badge.cells, BANNER_BADGE_SCALE, BANNER_MARGIN, badgeY)
  if (ticker) {
    const t = bannerTickerGeometry(ticker)
    const cells = textPixels(ticker).map(([x, y]) => ({ x, y, color: TICKER_COLOR }))
    drawCells(ctx, cells, t.scale, t.x, t.y)
  }
  return canvas
}

/** File name from the ticker: letters and digits only (`$` and spaces dropped). */
export function exportName(kind: 'badge' | 'banner', ticker: string): string {
  const safe = ticker.replace(/[^A-Z0-9]/g, '')
  return safe ? `pixel-${kind}-${safe}.png` : `pixel-${kind}.png`
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png')
  })
}

/** Saves a canvas as a PNG through a local blob: URL. Nothing leaves the browser. */
export async function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const blob = await toBlob(canvas)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
