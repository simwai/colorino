import { type Palette } from './types.js'

// Default palette for dark backgrounds (light text)
export const darkDraculaPalette: Palette = {
  log: '#f8f8f2',
  debug: '#f1fa8c',
  error: '#ff5555',
  info: '	#8be9fd',
  trace: '#bd93f9',
  warn: '#ffb86c',
}

export const darkThemePalette: Palette = {
  log: '#f8f8f2',
  info: '#8be9fd',
  warn: '#ffb86c',
  error: '#ff5555',
  trace: '#bd93f9',
  debug: '#f1fa8c',
}

// Default palette for light backgrounds (dark text)
export const lightThemePalette: Palette = {
  log: '#2e3440',
  info: '#5e81ac',
  warn: '#d08770',
  error: '#bf616a',
  trace: '#b48ead',
  debug: '#a3be8c',
}
