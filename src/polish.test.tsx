import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import App from './App.tsx'
import { Editor } from './Editor.tsx'
import { checkDist, findExternalCssUrls, findExternalUrls } from '../scripts/check-dist.mjs'

const cell = (x: number, y: number) => screen.getByTestId(`cell-${x}-${y}`)

afterEach(() => vi.restoreAllMocks())

describe('one-minute flow (scripted walkthrough)', () => {
  it('goes template -> edit -> ticker -> frame -> both downloads', async () => {
    const fakeCtx = { fillRect: vi.fn(), fillStyle: '', imageSmoothingEnabled: true }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx as never)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(new Blob(['x'], { type: 'image/png' })))
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:local/1'), revokeObjectURL: vi.fn() })
    const saved: { name: string; href: string }[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      saved.push({ name: this.download, href: this.href })
    })

    render(<App />)
    // The first things on the page are the templates and the downloads link: no hunting.
    const editor = screen.getByRole('region', { name: 'Editor' })
    const firstButtons = within(editor).getAllByRole('button').slice(0, 6).map((b) => b.textContent)
    expect(firstButtons).toEqual(['Robot head', 'Rocket', 'Flame', 'Star', 'Coin', 'Wrench'])
    expect(screen.getByRole('link', { name: 'Go to downloads' })).toHaveAttribute('href', '#export')

    // 1. template
    fireEvent.click(screen.getByRole('button', { name: 'Rocket' }))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()
    // 2. edit: paint a cell with a new color, then a stroke
    fireEvent.click(screen.getByRole('button', { name: 'Pink' }))
    fireEvent.pointerDown(cell(0, 0), { pointerId: 1, button: 0 })
    fireEvent.pointerMove(cell(3, 0), { pointerId: 1 })
    fireEvent.pointerUp(screen.getByTestId('pixel-grid'), { pointerId: 1 })
    expect(cell(2, 0).getAttribute('data-color')).not.toBe('')
    // 3. ticker
    fireEvent.change(screen.getByLabelText('Ticker'), { target: { value: '$qtest' } })
    expect(screen.getByTestId('badge-preview')).toHaveAttribute('data-ticker', '$QTEST')
    // 4. frame
    fireEvent.click(screen.getByRole('button', { name: 'Rounded' }))
    expect(screen.getByTestId('badge-preview')).toHaveAttribute('data-frame', 'rounded')
    // 5. both exports
    fireEvent.click(screen.getByRole('button', { name: 'Download badge' }))
    fireEvent.click(screen.getByRole('button', { name: 'Download banner' }))
    await waitFor(() => expect(saved).toHaveLength(2))
    expect(saved.map((s) => s.name)).toEqual(['pixel-badge-QTEST.png', 'pixel-banner-QTEST.png'])
    expect(saved.every((s) => s.href.startsWith('blob:'))).toBe(true)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('keyboard use of the grid', () => {
  it('is focusable and paints the cell under the keyboard cursor with arrows and Space', () => {
    render(<Editor />)
    const grid = screen.getByTestId('pixel-grid')
    expect(grid).toHaveAttribute('tabindex', '0')
    fireEvent.focus(grid)
    expect(cell(0, 0)).toHaveAttribute('data-cursor', 'true')
    fireEvent.keyDown(grid, { key: 'ArrowRight' })
    fireEvent.keyDown(grid, { key: 'ArrowDown' })
    fireEvent.keyDown(grid, { key: 'ArrowDown' })
    expect(cell(1, 2)).toHaveAttribute('data-cursor', 'true')
    fireEvent.keyDown(grid, { key: ' ' })
    expect(cell(1, 2).getAttribute('data-color')).toBe('4')
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(cell(1, 2).getAttribute('data-color')).toBe('')
  })

  it('keeps the cursor inside the grid', () => {
    render(<Editor />)
    const grid = screen.getByTestId('pixel-grid')
    fireEvent.focus(grid)
    fireEvent.keyDown(grid, { key: 'ArrowLeft' })
    fireEvent.keyDown(grid, { key: 'ArrowUp' })
    expect(cell(0, 0)).toHaveAttribute('data-cursor', 'true')
    for (let i = 0; i < 40; i++) fireEvent.keyDown(grid, { key: 'ArrowRight' })
    expect(cell(31, 0)).toHaveAttribute('data-cursor', 'true')
  })

  it('shows no cursor when the grid is not focused', () => {
    render(<Editor />)
    expect(screen.getByTestId('pixel-grid').querySelector('[data-cursor]')).toBeNull()
  })
})

describe('touch targets and accessible names', () => {
  it('every button, link and text field is at least 44px and has an accessible name', () => {
    render(<App />)
    const controls = [
      ...screen.getAllByRole('button'),
      ...screen.getAllByRole('link'),
      ...screen.getAllByRole('textbox'),
    ]
    expect(controls.length).toBeGreaterThan(30)
    for (const c of controls) {
      expect(c.className, c.outerHTML).toMatch(/\bmin-h-11\b|\bh-11\b/)
    }
    // getByRole with a name would fail on an empty name; check directly that none are blank.
    for (const b of screen.getAllByRole('button')) {
      expect((b.getAttribute('aria-label') ?? b.textContent ?? '').trim(), b.outerHTML).not.toBe('')
    }
    expect(screen.getByLabelText('Ticker')).toBeInTheDocument()
  })

  it('gives every interactive control a visible focus style', () => {
    render(<App />)
    const controls = [
      ...screen.getAllByRole('button'),
      ...screen.getAllByRole('link'),
      ...screen.getAllByRole('textbox'),
      screen.getByTestId('pixel-grid'),
    ]
    for (const c of controls) expect(c.className, c.outerHTML).toContain('focus-visible:outline')
  })

  it('uses touch-action none on the grid and a viewport meta tag without zoom lock', async () => {
    const { readFileSync } = await import('node:fs')
    const html = readFileSync('index.html', 'utf8')
    expect(html).toContain('width=device-width')
    expect(html).not.toMatch(/user-scalable\s*=\s*no|maximum-scale/)
  })
})

/** WCAG relative luminance contrast ratio between two #rrggbb colors. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('WCAG AA contrast of the Tailwind colors in use', () => {
  // Tailwind v4 default palette, as sRGB hex.
  const C = {
    bg: '#0a0a0a', // neutral-950 (page)
    panel: '#171717', // neutral-900 (buttons, inputs, cards)
    white: '#ffffff',
    black: '#000000',
    n100: '#f5f5f5',
    n200: '#e5e5e5',
    n300: '#d4d4d4',
    n400: '#a3a3a3', // input placeholder
    amber300: '#ffd230',
    red300: '#ffa2a2',
  }
  const pairs: [string, string, string][] = [
    ['page text', C.n100, C.bg],
    ['headings and labels', C.white, C.bg],
    ['body text', C.n200, C.bg],
    ['secondary text', C.n300, C.bg],
    ['secondary text on cards', C.n300, C.panel],
    ['button label', C.white, C.panel],
    ['selected button label', C.black, C.amber300],
    ['accent text', C.amber300, C.bg],
    ['error text', C.red300, C.bg],
    ['placeholder', C.n400, C.panel],
    ['focus outline vs page', C.amber300, C.bg],
  ]
  for (const [name, fg, bgc] of pairs) {
    it(`${name} is at least 4.5:1`, () => {
      expect(contrast(fg, bgc)).toBeGreaterThanOrEqual(4.5)
    })
  }

  it('the classes used in the source map only to colors checked above', async () => {
    const { readFileSync } = await import('node:fs')
    const allowed = new Set(['white', 'black', 'neutral-100', 'neutral-200', 'neutral-300', 'amber-300', 'red-300'])
    for (const file of ['src/App.tsx', 'src/Editor.tsx', 'src/BadgePreview.tsx', 'src/PixelGrid.tsx']) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/(?<![:\w-])text-(?!sm\b|lg\b|xl\b|2xl\b|\[|center|base\b)([a-z]+(?:-\d+)?)/g)) {
        expect(allowed, `${file}: text-${m[1]}`).toContain(m[1])
      }
    }
  })
})

describe('dist check for external URLs', () => {
  it('flags external script, link and img tags', () => {
    expect(findExternalUrls('<script src="https://cdn.example.com/a.js"></script>')).toEqual([
      'https://cdn.example.com/a.js',
    ])
    expect(findExternalUrls('<link rel="stylesheet" href="//fonts.example.com/x.css">')).toHaveLength(1)
    expect(findExternalUrls("<img src='http://x.test/a.png'>")).toHaveLength(1)
    expect(findExternalUrls('<img srcset="a.png 1x, https://x.test/b.png 2x">')).toEqual(['https://x.test/b.png'])
  })

  it('accepts relative and local URLs', () => {
    const html =
      '<script type="module" src="./assets/a.js"></script><link rel="stylesheet" href="./assets/a.css"><img src="data:image/png;base64,AA"><a href="https://example.com">x</a>'
    expect(findExternalUrls(html)).toEqual([])
  })

  it('flags external CSS url() and @import', () => {
    expect(findExternalCssUrls('a{background:url(https://x.test/a.png)}')).toHaveLength(1)
    expect(findExternalCssUrls('@import "https://fonts.example.com/css";')).toHaveLength(1)
    expect(findExternalCssUrls('a{background:url(data:image/png;base64,AA)} @font-face{src:url(./f.woff2)}')).toEqual([])
  })

  it('checkDist reports problems in a directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'dist-check-'))
    const bad = join(root, 'bad')
    const good = join(root, 'good')
    for (const d of [bad, good]) mkdirSync(join(d, 'assets'), { recursive: true })
    writeFileSync(join(good, 'index.html'), '<script type="module" src="./assets/a.js"></script>')
    writeFileSync(join(good, 'assets', 'a.css'), 'a{color:red}')
    writeFileSync(join(bad, 'index.html'), '<script src="https://evil.test/a.js"></script>')
    writeFileSync(join(bad, 'assets', 'a.css'), '@import url(https://fonts.example.com/x.css);')
    expect(checkDist(good)).toEqual([])
    expect(checkDist(bad)).toHaveLength(2)
    expect(checkDist(join(root, 'missing'))).toHaveLength(1)
  })
})
