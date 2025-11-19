// @ts-ignore
import type { ColorinoOptions, Palette, LogLevel, TerminalTheme } from './types.js'
import { Colorino } from './colorino.js'
import { BrowserColorSupportDetector } from './browser-color-support-detector.js'
import { InputValidator } from './input-validator.js'
import { darkDraculaPalette } from './theme.js'

export function createColorino(
  palette: Partial<Palette>,
  options: ColorinoOptions = {}
): Colorino {
  const validator = new InputValidator()
  const browserDetector = new BrowserColorSupportDetector(
    window,
    navigator,
    options.theme
  )

  // The user's colors will override the defaults.
  const finalPalette: Palette = { ...darkDraculaPalette, ...palette }

  return new Colorino(
    finalPalette,
    validator,
    browserDetector, // Always use browser detector
    undefined, // Node detector is never available
    options
  )
}

export type { Palette, ColorinoOptions, LogLevel, TerminalTheme } from './types.js'

export const colorino = createColorino(darkDraculaPalette)
