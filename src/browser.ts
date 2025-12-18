import {
  type ColorinoOptions,
  type Palette,
  type LogLevel,
  type ThemeName,
  type TerminalTheme,
} from './types.js'
import { Colorino } from './colorino.js'
import { BrowserColorSupportDetector } from './browser-color-support-detector.js'
import { InputValidator } from './input-validator.js'
import { themePalettes } from './theme.js'
import { determineBaseTheme } from './determine-base-theme.js'

export function createColorino(
  palette: Partial<Palette> = {},
  options: ColorinoOptions = {}
): Colorino {
  const validator = new InputValidator()

  let detectorThemeOverride: TerminalTheme | undefined
  if (options.theme === 'dark' || options.theme === 'light') {
    detectorThemeOverride = options.theme
  }

  const browserDetector = new BrowserColorSupportDetector(
    window,
    navigator,
    detectorThemeOverride
  )

  const detectedBrowserTheme = browserDetector.getTheme()

  // 1. Determine the base theme name
  const themeOpt = options.theme ?? 'auto'
  const baseThemeName: ThemeName = determineBaseTheme(
    themeOpt,
    detectedBrowserTheme
  )

  // 2. Get the base palette from the registry
  const basePalette = themePalettes[baseThemeName]

  // 3. The user's colors will override the selected base theme.
  const finalPalette: Palette = { ...basePalette, ...palette }

  return new Colorino(
    finalPalette,
    validator,
    browserDetector, // Always use browser detector
    undefined, // Node detector is never available
    options
  )
}

export type { Palette, ColorinoOptions, LogLevel, ThemeName }
export { themePalettes }
export const colorino = createColorino()
