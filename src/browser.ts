import {
  type ColorinoOptions,
  type Palette,
  type LogLevel,
  type ThemeName,
  type TerminalTheme,
  Colorino,
} from './types.js'
import { MyColorino } from './colorino.js'
import { BrowserColorSupportDetector } from './browser-color-support-detector.js'
import { InputValidator } from './input-validator.js'
import { themePalettes } from './theme.js'
import { determineBaseTheme } from './determine-base-theme.js'

export function createColorino(
  userPalette: Partial<Palette> = {},
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

  // Determine the base theme name
  const themeOpt = options.theme ?? 'auto'
  const baseThemeName: ThemeName = determineBaseTheme(
    themeOpt,
    detectedBrowserTheme
  )

  // Get the base palette from the registry
  const basePalette = themePalettes[baseThemeName]

  // The user's colors will override the selected base theme.
  const finalPalette: Palette = { ...basePalette, ...userPalette }

  return new MyColorino(
    finalPalette,
    userPalette,
    validator,
    browserDetector, // Always use browser detector
    undefined, // Node detector is never available
    options
  )
}

export type { Palette, ColorinoOptions, LogLevel, ThemeName, Colorino }
export { themePalettes }
