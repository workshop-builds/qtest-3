import { describe, expect, it } from 'vitest'
import { GLYPHS, GLYPH_HEIGHT, GLYPH_WIDTH, textPixels, textWidth } from './font.ts'
import { FRAMES, FRAMED_SIZE, frameCells } from './frames.ts'
import { MAX_TICKER_LENGTH, TICKER_CHARS, sanitizeTicker } from './ticker.ts'
import { layoutBadge } from './badge.ts'
import { createPixels, setCell } from './pixels.ts'

describe('sanitizeTicker', () => {
  it('uppercases letters', () => {
    expect(sanitizeTicker('qtest')).toBe('QTEST')
  })
  it('keeps digits, $ and spaces', () => {
    expect(sanitizeTicker('$a 1')).toBe('$A 1')
  })
  it('drops characters that are not allowed', () => {
    expect(sanitizeTicker('a-b_c!é😀<>')).toBe('ABC')
  })
  it('keeps at most 10 characters', () => {
    expect(MAX_TICKER_LENGTH).toBe(10)
    expect(sanitizeTicker('abcdefghijklmnop')).toBe('ABCDEFGHIJ')
    expect(sanitizeTicker('a!b!c!d!e!f!g!h!i!j!k!l')).toBe('ABCDEFGHIJ')
  })
  it('returns an empty string for empty or fully rejected input', () => {
    expect(sanitizeTicker('')).toBe('')
    expect(sanitizeTicker('!!!')).toBe('')
  })
})

describe('pixel font', () => {
  it('has a well-formed glyph for every allowed character', () => {
    for (const ch of TICKER_CHARS) {
      const g = GLYPHS[ch]
      expect(g, `glyph for "${ch}"`).toBeDefined()
      expect(g).toHaveLength(GLYPH_HEIGHT)
      for (const row of g) expect(row).toMatch(new RegExp(`^[#.]{${GLYPH_WIDTH}}$`))
      if (ch !== ' ') expect(textPixels(ch).length).toBeGreaterThan(0)
    }
  })
  it('gives each visible glyph a distinct shape', () => {
    const seen = new Map<string, string>()
    for (const ch of TICKER_CHARS) {
      if (ch === ' ') continue
      const key = GLYPHS[ch].join('|')
      expect(seen.get(key), `"${ch}" duplicates "${seen.get(key)}"`).toBeUndefined()
      seen.set(key, ch)
    }
  })
  it('measures and places text with a one-column gap', () => {
    expect(textWidth('')).toBe(0)
    expect(textWidth('A')).toBe(5)
    expect(textWidth('AB')).toBe(11)
    const xs = textPixels('AA').map(([x]) => x)
    expect(Math.max(...xs)).toBeGreaterThanOrEqual(6)
    expect(Math.max(...xs)).toBeLessThan(textWidth('AA'))
  })
})

describe('frames', () => {
  const key = (id: (typeof FRAMES)[number]['id']) => frameCells(id).map(([x, y]) => `${x},${y}`).sort().join(';')
  it('offers three frame styles', () => {
    expect(FRAMES).toHaveLength(3)
  })
  it('renders each frame differently', () => {
    const keys = FRAMES.map((f) => key(f.id))
    expect(new Set(keys).size).toBe(3)
  })
  it('has no cells for none, and stays inside the framed square', () => {
    expect(frameCells('none')).toHaveLength(0)
    for (const id of ['square', 'rounded'] as const) {
      for (const [x, y] of frameCells(id)) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThan(FRAMED_SIZE)
      }
    }
  })
  it('cuts the corners of the rounded frame', () => {
    expect(frameCells('rounded').length).toBeLessThan(frameCells('square').length)
    const has = (id: 'square' | 'rounded', x: number, y: number) =>
      frameCells(id).some(([cx, cy]) => cx === x && cy === y)
    expect(has('square', 0, 0)).toBe(true)
    expect(has('rounded', 0, 0)).toBe(false)
    expect(has('rounded', FRAMED_SIZE - 1, FRAMED_SIZE - 1)).toBe(false)
    expect(has('rounded', 2, 0)).toBe(true)
  })
  it('produces different badge layouts per frame', () => {
    const px = setCell(createPixels(), 3, 3, 4)
    const layouts = FRAMES.map((f) => JSON.stringify(layoutBadge(px, 'QTEST', f.id).cells))
    expect(new Set(layouts).size).toBe(3)
  })
  it('keeps the drawing in the same place whatever the frame', () => {
    const px = setCell(createPixels(), 0, 0, 4)
    const at = (id: 'none' | 'square') =>
      layoutBadge(px, '', id).cells.find((c) => c.color === 4)
    expect(at('none')).toEqual(at('square'))
  })
})

describe('layoutBadge', () => {
  it('puts the ticker under the badge', () => {
    const l = layoutBadge(createPixels(), 'A', 'none')
    expect(l.height).toBeGreaterThan(FRAMED_SIZE)
    expect(l.cells.every((c) => c.y >= FRAMED_SIZE)).toBe(true)
  })
  it('has no text rows without a ticker', () => {
    expect(layoutBadge(createPixels(), '', 'none').height).toBe(FRAMED_SIZE)
  })
  it('fits a 10 character ticker inside the layout', () => {
    const l = layoutBadge(createPixels(), '$$$$$$$$$$', 'square')
    for (const c of l.cells) {
      expect(c.x).toBeGreaterThanOrEqual(0)
      expect(c.x).toBeLessThan(l.width)
      expect(c.y).toBeLessThan(l.height)
    }
  })
})
