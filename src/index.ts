import type { ColorinoOptions, Palette } from './types.js'
import { Colorino } from './colorino.js'
import { BrowserColorSupportDetector } from './browser-color-support-detector.js'
import { NodeColorSupportDetector } from './node-color-support-detector.js'
import { InputValidator } from './input-validator.js'
import { darkDraculaPalette } from './theme.js'
import { Result } from 'neverthrow'
import { ColorinoError } from './errors.js'

export function createColorino(
  palette: Palette,
  options: ColorinoOptions = {}
): Colorino {
  const validator = new InputValidator()

  const processResult = Result.fromThrowable(
    () => process,
    () => new ColorinoError('No process')
  )()

  const windowResult = Result.fromThrowable(
    () => window,
    () => new ColorinoError('No window')
  )()

  const navigatorResult = Result.fromThrowable(
    () => navigator,
    () => new ColorinoError('No navigator')
  )()

  const browserColorSupportDetector =
    windowResult.isOk() && navigatorResult.isOk()
      ? new BrowserColorSupportDetector(
          windowResult.value,
          navigatorResult.value,
          options.theme
        )
      : undefined

  const nodeColorSupportDetector = processResult.isOk()
    ? new NodeColorSupportDetector(processResult.value, options.theme)
    : undefined

  return new Colorino(
    palette,
    validator,
    browserColorSupportDetector,
    nodeColorSupportDetector,
    options
  )
}

export const colorino = createColorino(darkDraculaPalette, {
  disableWarnings: false,
})
