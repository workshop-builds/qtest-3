import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BADGE_EXPORT_SIZE,
  BANNER_HEIGHT,
  BANNER_WIDTH,
  badgeExportGeometry,
  bannerTickerGeometry,
  downloadCanvas,
  EXPORT_BACKGROUND,
  exportName,
  renderBadgeCanvas,
  renderBannerCanvas,
  type CanvasFactory,
} from './export.ts'
import { layoutBadge } from './badge.ts'
import { FRAMED_SIZE, FRAME_COLOR, FRAME_THICKNESS } from './frames.ts'
import { PALETTE } from './palette.ts'
import { createPixels, setCell } from './pixels.ts'

/** A tiny software canvas: fillRect writes opaque RGBA into a buffer, so tests can sample real pixels. */
interface FakeCanvas {
  width: number
  height: number
  data: Uint8ClampedArray
  smoothing: boolean
  rects: { x: number; y: number; w: number; h: number }[]
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const fakeFactory: CanvasFactory = (width, height) => {
  const state: FakeCanvas = {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
    smoothing: true,
    rects: [],
  }
  let fill = '#000000'
  const ctx = {
    set fillStyle(v: string) {
      fill = v
    },
    get fillStyle() {
      return fill
    },
    set imageSmoothingEnabled(v: boolean) {
      state.smoothing = v
    },
    get imageSmoothingEnabled() {
      return state.smoothing
    },
    fillRect(x: number, y: number, w: number, h: number) {
      state.rects.push({ x, y, w, h })
      const [r, g, b] = hexToRgb(fill)
      for (let yy = Math.max(0, y); yy < Math.min(height, y + h); yy++) {
        for (let xx = Math.max(0, x); xx < Math.min(width, x + w); xx++) {
          const i = (yy * width + xx) * 4
          state.data[i] = r
          state.data[i + 1] = g
          state.data[i + 2] = b
          state.data[i + 3] = 255
        }
      }
    },
  }
  return Object.assign(state, { getContext: () => ctx }) as unknown as HTMLCanvasElement
}

const asFake = (c: HTMLCanvasElement) => c as unknown as FakeCanvas
const px = (c: HTMLCanvasElement, x: number, y: number) => {
  const f = asFake(c)
  const i = (y * f.width + x) * 4
  return [f.data[i], f.data[i + 1], f.data[i + 2]]
}

describe('export sizes', () => {
  it('badge export is exactly 512x512', () => {
    const c = renderBadgeCanvas(createPixels(), 'QTEST', 'square', fakeFactory)
    expect([c.width, c.height]).toEqual([512, 512])
  })

  it('banner export is exactly 1500x500', () => {
    const c = renderBannerCanvas(createPixels(), 'QTEST', 'rounded', fakeFactory)
    expect([c.width, c.height]).toEqual([1500, 500])
  })

  it('keeps the exact sizes for an empty ticker and for the longest ticker', () => {
    for (const t of ['', '$$$$$$$$$$', 'WWWWWWWWWW']) {
      const b = renderBadgeCanvas(createPixels(), t, 'none', fakeFactory)
      const n = renderBannerCanvas(createPixels(), t, 'none', fakeFactory)
      expect([b.width, b.height]).toEqual([BADGE_EXPORT_SIZE, BADGE_EXPORT_SIZE])
      expect([n.width, n.height]).toEqual([BANNER_WIDTH, BANNER_HEIGHT])
    }
  })

  it('turns image smoothing off and draws only whole-number rectangles', () => {
    for (const make of [renderBadgeCanvas, renderBannerCanvas]) {
      const c = make(setCell(createPixels(), 3, 4, 4), 'ABC 123', 'rounded', fakeFactory)
      const f = asFake(c)
      expect(f.smoothing).toBe(false)
      expect(f.rects.length).toBeGreaterThan(1)
      for (const r of f.rects) {
        for (const v of [r.x, r.y, r.w, r.h]) expect(Number.isInteger(v)).toBe(true)
        expect(r.w).toBeGreaterThan(0)
        expect(r.h).toBeGreaterThan(0)
      }
    }
  })
})

describe('badge pixel sampling', () => {
  it('every pixel inside one drawn cell is the same palette color', () => {
    let pixels = createPixels()
    pixels = setCell(pixels, 5, 6, 11) // Blue
    pixels = setCell(pixels, 6, 6, 4) // Red next to it
    const c = renderBadgeCanvas(pixels, 'QTEST', 'square', fakeFactory)
    const layout = layoutBadge(pixels, 'QTEST', 'square')
    const { scale, ox, oy } = badgeExportGeometry(layout.width, layout.height)
    expect(scale).toBeGreaterThanOrEqual(10)

    for (const [gx, gy, idx] of [
      [5, 6, 11],
      [6, 6, 4],
    ]) {
      const cx = ox + (layout.width - FRAMED_SIZE) / 2 * scale + (FRAME_THICKNESS + gx) * scale
      const cy = oy + (FRAME_THICKNESS + gy) * scale
      const expected = hexToRgb(PALETTE[idx].hex)
      for (let y = cy; y < cy + scale; y++) {
        for (let x = cx; x < cx + scale; x++) expect(px(c, Math.floor(x), y)).toEqual(expected)
      }
    }
  })

  it('has no blended pixels: every pixel is the background or a palette color', () => {
    let pixels = createPixels()
    for (let i = 0; i < 20; i++) pixels = setCell(pixels, i, i, i % 16)
    for (const c of [
      renderBadgeCanvas(pixels, 'A$ 9', 'rounded', fakeFactory),
      renderBannerCanvas(pixels, 'A$ 9', 'rounded', fakeFactory),
    ]) {
      const allowed = new Set([EXPORT_BACKGROUND, ...PALETTE.map((p) => p.hex)].map((h) => hexToRgb(h).join(',')))
      const f = asFake(c)
      let bad = 0
      for (let i = 0; i < f.width * f.height; i++) {
        const ok = f.data[i * 4 + 3] === 255 && allowed.has(`${f.data[i * 4]},${f.data[i * 4 + 1]},${f.data[i * 4 + 2]}`)
        if (!ok) bad++
      }
      expect(bad).toBe(0)
    }
  })

  it('shows the frame color in the frame ring and leaves the corner of a rounded frame empty', () => {
    const sq = renderBadgeCanvas(createPixels(), '', 'square', fakeFactory)
    const ro = renderBadgeCanvas(createPixels(), '', 'rounded', fakeFactory)
    const none = renderBadgeCanvas(createPixels(), '', 'none', fakeFactory)
    const { scale, ox, oy } = badgeExportGeometry(FRAMED_SIZE, FRAMED_SIZE)
    const frameRgb = hexToRgb(PALETTE[FRAME_COLOR].hex)
    const bg = hexToRgb(EXPORT_BACKGROUND)
    expect(px(sq, ox + 1, oy + 1)).toEqual(frameRgb)
    expect(px(ro, ox + 1, oy + 1)).toEqual(bg)
    expect(px(ro, ox + scale * 3, oy + 1)).toEqual(frameRgb)
    expect(px(none, ox + 1, oy + 1)).toEqual(bg)
  })

  it('draws the ticker under the badge', () => {
    const withText = renderBadgeCanvas(createPixels(), 'QTEST', 'none', fakeFactory)
    const without = renderBadgeCanvas(createPixels(), '', 'none', fakeFactory)
    const white = hexToRgb('#ffffff').join(',')
    const countWhite = (c: HTMLCanvasElement) => {
      let n = 0
      const f = asFake(c)
      for (let i = 0; i < f.width * f.height; i++) {
        if ([f.data[i * 4], f.data[i * 4 + 1], f.data[i * 4 + 2]].join(',') === white) n++
      }
      return n
    }
    expect(countWhite(without)).toBe(0)
    expect(countWhite(withText)).toBeGreaterThan(0)
  })
})

describe('banner layout', () => {
  it('puts the badge on the left and the ticker on the right, inside the canvas', () => {
    const pixels = setCell(createPixels(), 0, 0, 4)
    const c = renderBannerCanvas(pixels, 'QTEST', 'square', fakeFactory)
    const white = [255, 255, 255]
    let minX = Infinity
    let maxX = -1
    const f = asFake(c)
    for (let y = 0; y < f.height; y++) {
      for (let x = 0; x < f.width; x++) {
        if (px(c, x, y).join() === white.join()) {
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
        }
      }
    }
    const t = bannerTickerGeometry('QTEST')
    expect(minX).toBeGreaterThanOrEqual(t.x)
    expect(maxX).toBeLessThan(BANNER_WIDTH)
    expect(minX).toBeGreaterThan(BANNER_WIDTH / 3)
    // The badge frame is on the left third.
    expect(px(c, 33, 250)).toEqual(hexToRgb(PALETTE[FRAME_COLOR].hex))
  })

  it('fits the longest ticker and uses a whole-number scale', () => {
    for (const t of ['A', 'WWWWWWWWWW', '$$$$$$$$$$']) {
      const g = bannerTickerGeometry(t)
      expect(Number.isInteger(g.scale)).toBe(true)
      expect(g.scale).toBeGreaterThanOrEqual(1)
      expect(g.x).toBeGreaterThan(BANNER_WIDTH / 3)
      expect(g.y).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('file names and download', () => {
  afterEach(() => vi.restoreAllMocks())

  it('names files from letters and digits of the ticker', () => {
    expect(exportName('badge', 'QT $5')).toBe('pixel-badge-QT5.png')
    expect(exportName('banner', '')).toBe('pixel-banner.png')
    expect(exportName('banner', '$ ')).toBe('pixel-banner.png')
  })

  it('downloads through a local blob: URL only', async () => {
    const blob = new Blob(['x'], { type: 'image/png' })
    const canvas = { toBlob: (cb: (b: Blob | null) => void) => cb(blob) } as unknown as HTMLCanvasElement
    const create = vi.fn(() => 'blob:local/1')
    const revoke = vi.fn()
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke })
    const hrefs: string[] = []
    const names: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      hrefs.push(this.href)
      names.push(this.download)
    })
    await downloadCanvas(canvas, 'pixel-badge.png')
    expect(create).toHaveBeenCalledWith(blob)
    expect(hrefs).toEqual(['blob:local/1'])
    expect(names).toEqual(['pixel-badge.png'])
  })

  it('rejects when PNG encoding fails', async () => {
    const canvas = { toBlob: (cb: (b: Blob | null) => void) => cb(null) } as unknown as HTMLCanvasElement
    await expect(downloadCanvas(canvas, 'x.png')).rejects.toThrow()
  })
})
