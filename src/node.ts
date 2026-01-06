import { MyColorino } from './colorino.js'
import { determineBaseTheme } from './determine-base-theme.js'
import { InputValidator } from './input-validator.js'
import { NodeColorSupportDetector } from './node-color-support-detector.js'
import { themePalettes } from './theme.js'
import { Palette, ColorinoOptions, Colorino, TerminalTheme } from './types.js'

export function createColorino(
  userPalette: Partial<Palette> = {},
  options: ColorinoOptions = {}
): Colorino {
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
    detectorThemeOverride,
    options.disableOscProbe ?? false
  )
  const detectedTerminalTheme =
    themeOpt === 'auto' && !options.disableOscProbe
      ? nodeDetector.getTheme()
      : 'unknown'

  const baseThemeName = determineBaseTheme(themeOpt, detectedTerminalTheme)
  const basePalette = themePalettes[baseThemeName]
  const finalPalette: Palette = { ...basePalette, ...userPalette }

  return new MyColorino(
    finalPalette,
    userPalette,
    validator,
    undefined,
    nodeDetector,
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
