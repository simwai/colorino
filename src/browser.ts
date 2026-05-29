import { ColorinoBrowser } from './colorino-browser.js'
import { BrowserColorSupportDetector } from './browser-color-support-detector.js'
import { getThemePalette, themePalettes } from './theme.js'
import { determineBaseTheme } from './determine-base-theme.js'
import { LogLevel, Palette, TerminalTheme, ThemeName } from './types.js'
import { ColorinoOptions, ColorinoBrowserInterface } from './interfaces.js'

/**
 * Creates a new Colorino logger instance for the browser.
 * @param userPalette - Optional custom hex colors for log levels.
 * @param options - Configuration for theme, filtering, and metadata.
 */
// @__NO_SIDE_EFFECTS__
export function createColorino(
  userPalette: Partial<Palette> = {},
  options: ColorinoOptions = {}
): ColorinoBrowserInterface {
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
  const baseThemeName = determineBaseTheme(themeOpt, detectedBrowserTheme)

  const basePalette = getThemePalette(baseThemeName)
  const finalPalette: Palette = { ...basePalette, ...userPalette }

  const colorLevel = browserDetector.isBrowserEnv()
    ? (browserDetector.getColorLevel() ?? 'UnknownEnv')
    : 'UnknownEnv'

  return new ColorinoBrowser(finalPalette, userPalette, colorLevel, options)
}

export type { Palette, LogLevel, ThemeName, TerminalTheme }
export type { ColorinoOptions, ColorinoBrowserInterface }
export { themePalettes }

/** Default Colorino logger instance for the browser. */
export const colorino = /* @__PURE__ */ createColorino()
