import {
  catppuccinMochaPalette,
  catppuccinLattePalette,
  draculaPalette,
  githubLightPalette,
  minimalDarkPalette,
  minimalLightPalette,
} from './palettes.js'
import type { Palette, ThemeName } from './types.js'

export const themePalettes: Record<ThemeName, Palette> = {
  'catppuccin-mocha': catppuccinMochaPalette,
  'catppuccin-latte': catppuccinLattePalette,
  dracula: draculaPalette,
  'github-light': githubLightPalette,
  'minimal-dark': minimalDarkPalette,
  'minimal-light': minimalLightPalette,
}

export const defaultDarkTheme: ThemeName = 'minimal-dark'
export const defaultLightTheme: ThemeName = 'minimal-light'

export function isThemeName(theme: string): theme is ThemeName {
  return theme in themePalettes
}
