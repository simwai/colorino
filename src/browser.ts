import { ColorinoBrowser } from './colorino-browser.js'
import { BrowserColorSupportDetector } from './browser-color-support-detector.js'
import { InputValidator } from './input-validator.js'
import { themePalettes } from './theme.js'
import { determineBaseTheme } from './determine-base-theme.js'
import { LogLevel, Palette, TerminalTheme, ThemeName } from './types.js'
import { ColorinoOptions, ColorinoBrowserInterface } from './interfaces.js'

export function createColorino(
  userPalette: Partial<Palette> = {},
  options: ColorinoOptions = {}
): ColorinoBrowserInterface {
  const validator = new InputValidator()

  let detectorThemeOverride: TerminalTheme | undefined
  if (options.theme === 'dark' || options.theme === 'light') {
    detectorThemeOverride = options.theme
  }

  const browserDetector = new BrowserColorSupportDetector(
    !!options.disableWarnings,
    window,
    navigator,
    detectorThemeOverride
  )

  const detectedBrowserTheme = browserDetector.getTheme()

  const themeOpt = options.theme ?? 'auto'
  const baseThemeName = determineBaseTheme(themeOpt, detectedBrowserTheme)

  const basePalette = themePalettes[baseThemeName]
  const finalPalette: Palette = { ...basePalette, ...userPalette }

  const colorLevel = browserDetector.isBrowserEnv()
    ? (browserDetector.getColorLevel() ?? 'UnknownEnv')
    : 'UnknownEnv'

  return new ColorinoBrowser(
    finalPalette,
    userPalette,
    validator,
    colorLevel,
    options
  )
}

export type { Palette, LogLevel, ThemeName }
export type { ColorinoOptions, ColorinoBrowserInterface }
export { themePalettes }
export const colorino = createColorino()
