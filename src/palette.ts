/** The fixed 16-color palette. Pixels store an index into this list. */
export interface PaletteColor {
  name: string
  hex: string
}

export const PALETTE: readonly PaletteColor[] = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Gray', hex: '#8b8b8b' },
  { name: 'Brown', hex: '#8a4b2a' },
  { name: 'Red', hex: '#e63946' },
  { name: 'Orange', hex: '#f77f00' },
  { name: 'Yellow', hex: '#ffd60a' },
  { name: 'Lime', hex: '#8ac926' },
  { name: 'Green', hex: '#2a9d4b' },
  { name: 'Teal', hex: '#1fb5a8' },
  { name: 'Sky', hex: '#4cc9f0' },
  { name: 'Blue', hex: '#2f6fed' },
  { name: 'Navy', hex: '#1d2a62' },
  { name: 'Purple', hex: '#7b3fe4' },
  { name: 'Pink', hex: '#ff6fb5' },
  { name: 'Peach', hex: '#f4b9a0' },
]
