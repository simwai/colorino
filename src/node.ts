import { ColorinoNode } from './colorino-node.js'
import { determineBaseTheme } from './determine-base-theme.js'
import { InputValidator } from './input-validator.js'
import { NodeColorSupportDetector } from './node-color-support-detector.js'
import { themePalettes } from './theme.js'
import { LogLevel, Palette, TerminalTheme, ThemeName } from './types.js'
import { ColorinoOptions, ColorinoNodeInterface } from './interfaces.js'

/**
 * Creates a new Colorino logger instance for Node.js.
 * @param userPalette - Optional custom hex colors for log levels.
 * @param options - Configuration for theme, filtering, metadata, and file logging.
 */
export function createColorino(
  userPalette: Partial<Palette> = {},
  options: ColorinoOptions = {}
): ColorinoNodeInterface {
  const validator = new InputValidator()
  const themeOption = options.theme ?? 'auto'

  let detectorTheme: TerminalTheme | undefined
  if (themeOption === 'dark' || themeOption === 'light') {
    detectorTheme = themeOption
  } else if (themeOption !== 'auto') {
    detectorTheme = 'unknown'
  }

  const detector = new NodeColorSupportDetector(process, detectorTheme, options.isOsc11Enabled)
  const baseTheme = determineBaseTheme(themeOption, themeOption === 'auto' ? detector.getTheme() : 'unknown')
  const finalPalette: Palette = { ...themePalettes[baseTheme], ...userPalette }
  const colorLevel = detector.isNodeEnv() ? (detector.getColorLevel() ?? 'UnknownEnv') : 'UnknownEnv'

  return new ColorinoNode(finalPalette, userPalette, validator, colorLevel, options)
}

export type { Palette, LogLevel, ThemeName }
export type { ColorinoOptions, ColorinoNodeInterface }
export { themePalettes }

/** Default Colorino logger instance for Node.js. */
export const colorino = createColorino()
