import type { Palette } from '../../types.js'

const defaultPalette: Palette = {
  log: '#ffffff',
  info: '#00ffff',
  warn: '#ffff00',
  error: '#ff0000',
  trace: '#bd93f9',
  debug: '#f1fa8c',
}
export function createTestPalette(overrides: Partial<Palette> = {}): Palette {
  return { ...defaultPalette, ...overrides }
}