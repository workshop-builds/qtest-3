import { describe, expect, it } from 'vitest'
import { TEMPLATES } from './templates.ts'
import { PALETTE } from './palette.ts'
import { GRID_SIZE, createPixels, setCell } from './pixels.ts'
import { STORAGE_KEY, emptyBadge, loadBadge, parseSaved, saveBadge, serializeBadge } from './storage.ts'

describe('templates', () => {
  it('has the six requested templates', () => {
    expect(TEMPLATES.map((t) => t.name)).toEqual(['Robot head', 'Rocket', 'Flame', 'Star', 'Coin', 'Wrench'])
  })

  for (const t of TEMPLATES) {
    it(`${t.name} is a valid, non-empty 32x32 grid of palette colors`, () => {
      expect(t.pixels).toHaveLength(GRID_SIZE * GRID_SIZE)
      for (const c of t.pixels) {
        expect(c === null || (Number.isInteger(c) && c >= 0 && c < PALETTE.length)).toBe(true)
      }
      const filled = t.pixels.filter((c) => c !== null).length
      expect(filled).toBeGreaterThan(60)
      expect(filled).toBeLessThan(GRID_SIZE * GRID_SIZE)
    })
  }

  it('templates are all different from each other', () => {
    const keys = new Set(TEMPLATES.map((t) => JSON.stringify(t.pixels)))
    expect(keys.size).toBe(TEMPLATES.length)
  })

  it('templates can be edited without changing the template itself', () => {
    const t = TEMPLATES[0]
    const before = JSON.stringify(t.pixels)
    const edited = setCell(t.pixels, 0, 0, 5)
    expect(edited).not.toBe(t.pixels)
    expect(JSON.stringify(t.pixels)).toBe(before)
  })
})

describe('saving', () => {
  const sample = () => ({ pixels: setCell(setCell(createPixels(), 3, 4, 7), 31, 31, 15), ticker: 'QT$ 9', frame: 'rounded' as const })

  it('round-trips pixels, ticker and frame through storage', () => {
    const store = new Map<string, string>()
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) }
    expect(saveBadge(sample(), storage)).toBe(true)
    expect(loadBadge(storage)).toEqual(sample())
  })

  it('round-trips through the real localStorage', () => {
    saveBadge(sample())
    expect(loadBadge()).toEqual(sample())
  })

  it('falls back to an empty badge when nothing is saved', () => {
    expect(loadBadge()).toEqual(emptyBadge())
  })

  it('falls back to an empty badge for corrupt data', () => {
    const bad = [
      'not json {',
      'null',
      '42',
      '[]',
      '{}',
      JSON.stringify({ v: 2, pixels: createPixels(), ticker: '', frame: 'none' }),
      JSON.stringify({ v: 1, pixels: [1, 2, 3], ticker: '', frame: 'none' }),
      JSON.stringify({ v: 1, pixels: createPixels().map(() => 99), ticker: '', frame: 'none' }),
      JSON.stringify({ v: 1, pixels: createPixels().map(() => 'x'), ticker: '', frame: 'none' }),
      JSON.stringify({ v: 1, pixels: createPixels(), ticker: 5, frame: 'none' }),
      JSON.stringify({ v: 1, pixels: createPixels(), ticker: '', frame: 'fancy' }),
    ]
    for (const text of bad) {
      localStorage.setItem(STORAGE_KEY, text)
      expect(parseSaved(text)).toBeNull()
      expect(loadBadge()).toEqual(emptyBadge())
    }
  })

  it('cleans a saved ticker that has disallowed characters or is too long', () => {
    const text = serializeBadge({ pixels: createPixels(), ticker: 'ok', frame: 'none' }).replace('"ok"', '"abc-defghijklmn"')
    expect(parseSaved(text)?.ticker).toBe('ABCDEFGHIJ')
  })

  it('does not crash when storage throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('full')
      },
    }
    expect(loadBadge(broken)).toEqual(emptyBadge())
    expect(saveBadge(sample(), broken)).toBe(false)
  })
})
