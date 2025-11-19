import { type Palette } from './types.js'

// Low-contrast palette for dark backgrounds (light text)
export const catppuccinMochaPalette: Palette = {
  log: '#cdd6f4', // Text
  info: '#89b4fa', // Blue
  warn: '#f9e2af', // Yellow
  error: '#f38ba8', // Red
  debug: '#a6adc8', // Subtext0
  trace: '#9399b2', // Subtext1
};


// Low-contrast palette for light backgrounds (dark text)
export const catppuccinLattePalette: Palette = {
  log: '#4c4f69', // Text
  info: '#1e66f5', // Blue
  warn: '#df8e1d', // Yellow
  error: '#d20f39', // Red
  debug: '#7c7f93', // Subtext0
  trace: '#8c8fa1', // Subtext1
};


// High-contrast palette for dark backgrounds (light text)
export const draculaPalette: Palette = {
  log: '#f8f8f2', // Foreground
  info: '#8be9fd', // Cyan
  warn: '#f1fa8c', // Yellow
  error: '#ff5555', // Red
  debug: '#bd93f9', // Purple
  trace: '#6272a4', // Comment
};


// High-contrast palette for light backgrounds (dark text)
export const githubLightPalette: Palette = {
  log: '#24292e', // Text
  info: '#0366d6', // Blue
  warn: '#f9a002', // Yellow
  error: '#d73a49', // Red
  debug: '#586069', // Gray
  trace: '#6a737d', // Gray-light
};
