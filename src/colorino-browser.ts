import { AbstractColorino } from './abstract-colorino.js'
import { ColorLevel } from './enums.js'
import {
  ConsoleMethod,
  ColorinoBrowserObject,
  Palette,
  ColorinoOptions,
} from './types.js'
import { TypeValidator } from './type-validator.js'
import { InputValidator } from './input-validator.js'

export class ColorinoBrowser extends AbstractColorino {
  constructor(
    initialPalette: Palette,
    userPalette: Partial<Palette>,
    validator: InputValidator,
    colorLevel: ColorLevel | 'UnknownEnv',
    options: ColorinoOptions = {}
  ) {
    super(initialPalette, userPalette, validator, colorLevel, options)
  }

  protected applyColors(
    consoleMethod: ConsoleMethod,
    args: unknown[]
  ): unknown[] {
    const formatParts: string[] = []
    const cssArgs: string[] = []
    const otherArgs: unknown[] = []

    const paletteHex = this._palette[consoleMethod]

    for (const arg of args) {
      if (TypeValidator.isBrowserColorizedArg(arg)) {
        formatParts.push(`%c${arg.text}`)
        cssArgs.push(`color:${arg.hex}`)
        continue
      }

      if (TypeValidator.isBrowserObjectArg(arg)) {
        formatParts.push('%o')
        otherArgs.push(arg.value)
        continue
      }

      if (TypeValidator.isString(arg)) {
        formatParts.push(`%c${arg}`)
        cssArgs.push(`color:${paletteHex}`)
        continue
      }

      formatParts.push('%o')
      otherArgs.push(arg)
    }

    if (formatParts.length === 0) return args

    return [formatParts.join(''), ...cssArgs, ...otherArgs]
  }

  protected output(consoleMethod: ConsoleMethod, args: unknown[]): void {
    console[consoleMethod](...args)
  }

  protected processArgs(args: unknown[]): unknown[] {
    const processedArgs: unknown[] = []
    let previousWasObject = false

    for (const arg of args) {
      if (TypeValidator.isBrowserColorizedArg(arg)) {
        processedArgs.push(arg)

        previousWasObject = false
        continue
      }

      if (TypeValidator.isFormattableObject(arg)) {
        processedArgs.push({
          [ColorinoBrowserObject]: true,
          value: arg,
        })

        previousWasObject = true
      } else if (TypeValidator.isError(arg)) {
        processedArgs.push('\n', this._cleanErrorStack(arg))

        previousWasObject = true
      } else {
        processedArgs.push(
          TypeValidator.isString(arg) && previousWasObject ? `\n${arg}` : arg
        )

        previousWasObject = false
      }
    }

    return processedArgs
  }

  protected isBrowser(): boolean {
    return true
  }
}
