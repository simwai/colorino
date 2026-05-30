import {
  catppuccinMochaPalette,
  catppuccinLattePalette,
  draculaPalette,
  githubLightPalette,
} from './palettes.js'
import type { Palette, ThemeName } from './types.js'

/**
 * Retrieves a palette by theme name.
 *
 * @param name - The name of the theme.
 * @returns The associated palette.
 */
// @__NO_SIDE_EFFECTS__
export function getThemePalette(name: ThemeName): Palette {
  switch (name) {
    case 'catppuccin-mocha':
      return catppuccinMochaPalette
    case 'catppuccin-latte':
      return catppuccinLattePalette
    case 'dracula':
      return draculaPalette
    case 'github-light':
      return githubLightPalette
    default:
      return draculaPalette
  }
}

/** @deprecated Use getThemePalette instead */
export const themePalettes: Record<ThemeName, Palette> =
  /* @__PURE__ */ (() => ({
    'catppuccin-mocha': catppuccinMochaPalette,
    'catppuccin-latte': catppuccinLattePalette,
    dracula: draculaPalette,
    'github-light': githubLightPalette,
  }))()

export const defaultDarkTheme: ThemeName = 'dracula'
export const defaultLightTheme: ThemeName = 'github-light'

/**
 * Checks if a string is a valid theme name.
 *
 * @param theme - The string to check.
 * @returns True if it's a valid theme name.
 */
// @__NO_SIDE_EFFECTS__
export function isThemeName(theme: string): theme is ThemeName {
  return theme in themePalettes
}
