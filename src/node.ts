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
  const themeOpt = options.theme ?? 'auto'
  let detTheme: TerminalTheme | undefined
  if (themeOpt === 'dark' || themeOpt === 'light') detTheme = themeOpt
  else if (themeOpt !== 'auto') detTheme = 'unknown'

  const detector = new NodeColorSupportDetector(process, detTheme, options.isOsc11Enabled)
  const baseTheme = determineBaseTheme(themeOpt, themeOpt === 'auto' ? detector.getTheme() : 'unknown')
  const finalPalette: Palette = { ...themePalettes[baseTheme], ...userPalette }
  const colorLevel = detector.isNodeEnv() ? (detector.getColorLevel() ?? 'UnknownEnv') : 'UnknownEnv'

  return new ColorinoNode(finalPalette, userPalette, validator, colorLevel, options)
}

export type { Palette, LogLevel, ThemeName }
export type { ColorinoOptions, ColorinoNodeInterface }
export { themePalettes }

/** Default Colorino logger instance for Node.js. */
export const colorino = createColorino()
