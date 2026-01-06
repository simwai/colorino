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

  const themeOpt = options.theme ?? 'auto'
  const baseThemeName: ThemeName = determineBaseTheme(
    themeOpt,
    detectedBrowserTheme
  )

  const basePalette = themePalettes[baseThemeName]

  const finalPalette: Palette = { ...basePalette, ...userPalette }

  return new MyColorino(
    finalPalette,
    userPalette,
    validator,
    browserDetector,
    undefined,
    options
  )
}

export type {
  Palette,
  ColorinoOptions,
  LogLevel,
  ThemeName,
  Colorino,
} from './types.js'
export { themePalettes }
export const colorino = createColorino()
