import {
  Colorino,
  type ColorinoOptions,
  type Palette,
  type TerminalTheme,
} from './types.js'
import { MyColorino } from './colorino.js'
import { NodeColorSupportDetector } from './node-color-support-detector.js'
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

  const nodeDetector = new NodeColorSupportDetector(
    process,
    detectorThemeOverride
  )

  const detectedTerminalTheme = nodeDetector.getTheme()

  // 1. Determine the base theme name
  const themeOpt = options.theme ?? 'auto'
  const baseThemeName = determineBaseTheme(themeOpt, detectedTerminalTheme)

  // 2. Get the base palette from the registry
  const basePalette = themePalettes[baseThemeName]

  // 3. The user's colors will override the selected base theme.
  const finalPalette: Palette = { ...basePalette, ...palette }

  return new MyColorino(
    finalPalette,
    validator,
    undefined, // Browser detector is never available
    nodeDetector, // Always use node detector
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
