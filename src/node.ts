import type { ColorinoOptions, Palette } from './types.js'
import { Colorino } from './colorino.js'
import { NodeColorSupportDetector } from './node-color-support-detector.js'
import { InputValidator } from './input-validator.js'
import { darkDraculaPalette } from './theme.js'

export function createColorino(
  palette: Palette,
  options: ColorinoOptions = {}
): Colorino {
  const validator = new InputValidator()
  const nodeDetector = new NodeColorSupportDetector(process, options.theme)

  return new Colorino(
    palette,
    validator,
    undefined, // Browser detector is never available
    nodeDetector, // Always use node detector
    options
  )
}

export const colorino = createColorino(darkDraculaPalette)
