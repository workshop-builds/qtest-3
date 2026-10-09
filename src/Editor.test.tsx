import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Editor } from './Editor.tsx'
import { PALETTE } from './palette.ts'

const cell = (x: number, y: number) => screen.getByTestId(`cell-${x}-${y}`)
const color = (x: number, y: number) => cell(x, y).getAttribute('data-color')

describe('Editor ticker and frames', () => {
  it('uppercases and filters typed ticker text, and limits it to 10 characters', () => {
    render(<Editor />)
    const input = screen.getByLabelText('Ticker') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'qt-est!' } })
    expect(input.value).toBe('QTEST')
    fireEvent.change(input, { target: { value: 'abcdefghijklmn' } })
    expect(input.value).toBe('ABCDEFGHIJ')
    expect(screen.getByTestId('badge-preview')).toHaveAttribute('data-ticker', 'ABCDEFGHIJ')
  })

  it('draws the ticker on the preview', () => {
    render(<Editor />)
    const count = () => screen.getByTestId('badge-preview').querySelectorAll('rect').length
    expect(count()).toBe(0)
    fireEvent.change(screen.getByLabelText('Ticker'), { target: { value: 'A' } })
    expect(count()).toBeGreaterThan(0)
  })

  it('shows the picked frame on the preview', () => {
    render(<Editor />)
    const preview = screen.getByTestId('badge-preview')
    const counts: number[] = []
    for (const name of ['None', 'Square', 'Rounded']) {
      fireEvent.click(screen.getByRole('button', { name }))
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
      expect(preview).toHaveAttribute('data-frame', name.toLowerCase())
      counts.push(preview.querySelectorAll('rect').length)
    }
    expect(counts[0]).toBe(0)
    expect(counts[1]).toBeGreaterThan(counts[2])
    expect(counts[2]).toBeGreaterThan(0)
  })

  it('has frame buttons of at least 44px height', () => {
    render(<Editor />)
    expect(screen.getByRole('button', { name: 'Square' }).className).toContain('min-h-11')
  })
})

describe('Editor', () => {
  it('renders a 32x32 grid with touch-action none', () => {
    render(<Editor />)
    const grid = screen.getByTestId('pixel-grid')
    expect(grid.children).toHaveLength(1024)
    expect(grid.style.touchAction).toBe('none')
    expect(grid.style.aspectRatio).toBe('1 / 1')
  })

  it('shows exactly 16 swatches, with one marked as pressed', () => {
    render(<Editor />)
    const swatches = screen.getAllByTestId(/^swatch-/)
    expect(swatches).toHaveLength(16)
    expect(swatches.filter((s) => s.getAttribute('aria-pressed') === 'true')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Blue' }))
    expect(screen.getByRole('button', { name: 'Blue' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Red' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('sizes swatches to at least 44px', () => {
    render(<Editor />)
    for (const s of screen.getAllByTestId(/^swatch-/)) {
      expect(s.className).toContain('min-h-11')
      expect(s.className).toContain('min-w-11')
    }
  })

  it('a click on a cell paints it with the selected color', () => {
    render(<Editor />)
    fireEvent.click(screen.getByRole('button', { name: 'Blue' }))
    expect(color(4, 6)).toBe('')
    fireEvent.pointerDown(cell(4, 6), { pointerId: 1, button: 0 })
    fireEvent.pointerUp(cell(4, 6), { pointerId: 1 })
    expect(color(4, 6)).toBe(String(PALETTE.findIndex((c) => c.name === 'Blue')))
    expect(cell(4, 6).style.backgroundColor).not.toBe('')
  })

  it('a plain click event also paints the cell', () => {
    render(<Editor />)
    fireEvent.click(cell(1, 1))
    expect(color(1, 1)).toBe('4')
  })

  it('dragging paints every cell the pointer crosses', () => {
    render(<Editor />)
    fireEvent.click(screen.getByRole('button', { name: 'Green' }))
    const grid = screen.getByTestId('pixel-grid')
    fireEvent.pointerDown(cell(2, 2), { pointerId: 1, button: 0 })
    fireEvent.pointerMove(cell(3, 2), { pointerId: 1 })
    fireEvent.pointerMove(cell(6, 2), { pointerId: 1 }) // fast move skips cells; the line fills them
    fireEvent.pointerUp(grid, { pointerId: 1 })
    const green = String(PALETTE.findIndex((c) => c.name === 'Green'))
    for (let x = 2; x <= 6; x++) expect(color(x, 2)).toBe(green)
    expect(color(7, 2)).toBe('')
  })

  it('does not paint when moving without pressing', () => {
    render(<Editor />)
    fireEvent.pointerMove(cell(5, 5), { pointerId: 1 })
    expect(color(5, 5)).toBe('')
  })

  it('stops painting after the pointer is released', () => {
    render(<Editor />)
    fireEvent.pointerDown(cell(0, 0), { pointerId: 1, button: 0 })
    fireEvent.pointerUp(cell(0, 0), { pointerId: 1 })
    fireEvent.pointerMove(cell(5, 0), { pointerId: 1 })
    expect(color(5, 0)).toBe('')
  })

  it('erase mode clears cells by click and by drag', () => {
    render(<Editor />)
    const grid = screen.getByTestId('pixel-grid')
    fireEvent.pointerDown(cell(0, 0), { pointerId: 1, button: 0 })
    for (let x = 1; x <= 4; x++) fireEvent.pointerMove(cell(x, 0), { pointerId: 1 })
    fireEvent.pointerUp(grid, { pointerId: 1 })
    expect(color(3, 0)).not.toBe('')

    fireEvent.click(screen.getByRole('button', { name: 'Erase' }))
    expect(screen.getByRole('button', { name: 'Erase' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.pointerDown(cell(0, 0), { pointerId: 2, button: 0 })
    fireEvent.pointerUp(grid, { pointerId: 2 })
    expect(color(0, 0)).toBe('')
    expect(color(1, 0)).not.toBe('')

    fireEvent.pointerDown(cell(1, 0), { pointerId: 3, button: 0 })
    fireEvent.pointerMove(cell(4, 0), { pointerId: 3 })
    fireEvent.pointerUp(grid, { pointerId: 3 })
    for (let x = 0; x <= 4; x++) expect(color(x, 0)).toBe('')
  })

  it('undo and redo are disabled with nothing to step through', () => {
    render(<Editor />)
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
    fireEvent.click(cell(0, 0))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(color(0, 0)).toBe('')
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }))
    expect(color(0, 0)).toBe('4')
  })

  it('a whole drag is one undo step', () => {
    render(<Editor />)
    const grid = screen.getByTestId('pixel-grid')
    fireEvent.pointerDown(cell(2, 2), { pointerId: 1, button: 0 })
    fireEvent.pointerMove(cell(3, 2), { pointerId: 1 })
    fireEvent.pointerMove(cell(6, 2), { pointerId: 1 })
    fireEvent.pointerUp(grid, { pointerId: 1 })
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    for (let x = 2; x <= 6; x++) expect(color(x, 2)).toBe('')
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
  })

  it('a new edit after undo clears redo', () => {
    render(<Editor />)
    fireEvent.click(cell(0, 0))
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    fireEvent.click(cell(1, 1))
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
  })

  it('fill replaces the clicked region and is one undo step', () => {
    render(<Editor />)
    fireEvent.click(screen.getByRole('button', { name: 'Fill' }))
    expect(screen.getByRole('button', { name: 'Fill' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.pointerDown(cell(5, 5), { pointerId: 1, button: 0 })
    fireEvent.pointerUp(cell(5, 5), { pointerId: 1 })
    expect(color(0, 0)).toBe('4')
    expect(color(31, 31)).toBe('4')
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(color(0, 0)).toBe('')
    expect(color(31, 31)).toBe('')
  })

  it('fill does not refill while dragging', () => {
    render(<Editor />)
    fireEvent.click(cell(1, 0))
    fireEvent.click(screen.getByRole('button', { name: 'Blue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fill' }))
    const grid = screen.getByTestId('pixel-grid')
    fireEvent.pointerDown(cell(5, 5), { pointerId: 1, button: 0 })
    fireEvent.pointerMove(cell(1, 0), { pointerId: 1 })
    fireEvent.pointerUp(grid, { pointerId: 1 })
    expect(color(1, 0)).toBe('4') // the original red/default cell kept its color
  })

  it('mirror flips the drawing in one undoable step', () => {
    render(<Editor />)
    fireEvent.click(cell(2, 3))
    fireEvent.click(screen.getByRole('button', { name: 'Mirror' }))
    expect(color(2, 3)).toBe('')
    expect(color(29, 3)).toBe('4')
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(color(2, 3)).toBe('4')
    expect(color(29, 3)).toBe('')
  })

  it('picking a color switches back to draw mode', () => {
    render(<Editor />)
    fireEvent.click(screen.getByRole('button', { name: 'Erase' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pink' }))
    expect(screen.getByRole('button', { name: 'Draw' })).toHaveAttribute('aria-pressed', 'true')
  })
})
