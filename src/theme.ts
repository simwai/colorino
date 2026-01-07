import {
  catppuccinMochaPalette,
  catppuccinLattePalette,
  draculaPalette,
  githubLightPalette,
} from './palettes.js'
import type { Palette, ThemeName } from './types.js'

export const themePalettes: Record<ThemeName, Palette> = {
  'catppuccin-mocha': catppuccinMochaPalette,
  'catppuccin-latte': catppuccinLattePalette,
  dracula: draculaPalette,
  'github-light': githubLightPalette,
}

export const defaultDarkTheme: ThemeName = 'dracula'
export const defaultLightTheme: ThemeName = 'github-light'

export function isThemeName(theme: string): theme is ThemeName {
  return theme in themePalettes
}
