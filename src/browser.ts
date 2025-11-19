import { ColorinoOptions, Palette } from './types.js'
import { Colorino } from './colorino.js'
import { BrowserColorSupportDetector } from './browser-color-support-detector.js'
import { InputValidator } from './input-validator.js'
import { darkDraculaPalette } from './theme.js'

export function createColorino(
  palette: Palette,
  options: ColorinoOptions = {}
): Colorino {
  const validator = new InputValidator()
  const browserDetector = new BrowserColorSupportDetector(
    window,
    navigator,
    options.theme
  )

  return new Colorino(
    palette,
    validator,
    browserDetector, // Always use browser detector
    undefined, // Node detector is never available
    options
  )
}

export { Palette, ColorinoOptions, LogLevel, TerminalTheme } from './types.js'

export const colorino = createColorino(darkDraculaPalette)
