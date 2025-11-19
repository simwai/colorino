// @ts-ignore
import type { ColorinoOptions, Palette, LogLevel, TerminalTheme } from './types.js'
import { Colorino } from './colorino.js'
import { NodeColorSupportDetector } from './node-color-support-detector.js'
import { InputValidator } from './input-validator.js'
import { darkDraculaPalette } from './theme.js'

export function createColorino(
  palette: Partial<Palette>,
  options: ColorinoOptions = {}
): Colorino {
  const validator = new InputValidator()
  const nodeDetector = new NodeColorSupportDetector(process, options.theme)

  // The user's colors will override the defaults.
  const finalPalette: Palette = { ...darkDraculaPalette, ...palette }

  return new Colorino(
    finalPalette,
    validator,
    undefined, // Browser detector is never available
    nodeDetector, // Always use node detector
    options
  )
}

export type { Palette, ColorinoOptions, LogLevel, TerminalTheme } from './types.js'

export const colorino = createColorino(darkDraculaPalette)
