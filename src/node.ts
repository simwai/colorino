import { ColorinoNode } from './colorino-node.js'
import { determineBaseTheme } from './determine-base-theme.js'
import { InputValidator } from './input-validator.js'
import { NodeColorSupportDetector } from './node-color-support-detector.js'
import { themePalettes } from './theme.js'
import { LogLevel, Palette, TerminalTheme, ThemeName } from './types.js'
import { ColorinoOptions, ColorinoNodeInterface } from './interfaces.js'

export function createColorino(
  userPalette: Partial<Palette> = {},
  options: ColorinoOptions = {}
): ColorinoNodeInterface {
  const validator = new InputValidator()

  const themeOpt = options.theme ?? 'auto'

  let detectorThemeOverride: TerminalTheme | undefined
  if (themeOpt === 'dark' || themeOpt === 'light') {
    detectorThemeOverride = themeOpt
  } else if (themeOpt !== 'auto') {
    detectorThemeOverride = 'unknown'
  }

  const nodeDetector = new NodeColorSupportDetector(
    process,
    detectorThemeOverride
  )
  const detectedTerminalTheme =
    themeOpt === 'auto' ? nodeDetector.getTheme() : 'unknown'

  const baseThemeName = determineBaseTheme(themeOpt, detectedTerminalTheme)
  const basePalette = themePalettes[baseThemeName]
  const finalPalette: Palette = { ...basePalette, ...userPalette }

  const colorLevel = nodeDetector.isNodeEnv()
    ? (nodeDetector.getColorLevel() ?? 'UnknownEnv')
    : 'UnknownEnv'

  return new ColorinoNode(
    finalPalette,
    userPalette,
    validator,
    colorLevel,
    options
  )
}

export type { Palette, LogLevel, ThemeName }
export type { ColorinoOptions, ColorinoNodeInterface }
export { themePalettes }
export const colorino = createColorino()
