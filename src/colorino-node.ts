import { AbstractColorino } from './abstract-colorino.js'
import { ColorLevel } from './enums.js'
import { ConsoleMethod } from './types.js'
import { TypeValidator } from './type-validator.js'
import { colorConverter } from './color-converter.js'
import { Palette } from './types.js'
import { ColorinoNodeInterface, ColorinoOptions } from './interfaces.js'
import { InputValidator } from './input-validator.js'

export class ColorinoNode
  extends AbstractColorino
  implements ColorinoNodeInterface
{
  constructor(
    initialPalette: Palette,
    userPalette: Partial<Palette>,
    validator: InputValidator,
    colorLevel: ColorLevel | 'UnknownEnv',
    options: ColorinoOptions = {}
  ) {
    super(initialPalette, userPalette, validator, colorLevel, options)
  }

  public gradient(text: string, startHex: string, endHex: string): string {
    if (
      this._colorLevel === ColorLevel.NO_COLOR ||
      this._colorLevel === 'UnknownEnv' ||
      this._colorLevel === ColorLevel.ANSI
    ) {
      return text
    }

    const characters = [...text]
    const rgbColors = colorConverter.hex.gradient(
      startHex,
      endHex,
      characters.length
    )

    return (
      characters
        .map((char, index) => {
          const [r, g, b] = rgbColors[index] ?? [0, 0, 0]

          if (this._colorLevel === ColorLevel.TRUECOLOR) {
            return `\x1b[38;2;${r};${g};${b}m${char}`
          }

          const code = colorConverter.rgb.toAnsi256([r, g, b])
          return `\x1b[38;5;${code}m${char}`
        })
        .join('') + '\x1b[0m'
    )
  }

  protected _applyColors(
    consoleMethod: ConsoleMethod,
    args: unknown[]
  ): unknown[] {
    const paletteHex = this._palette[consoleMethod]
    const prefix = this._toAnsiPrefix(paletteHex)

    if (!prefix) return args

    return args.map(arg => {
      if (
        !TypeValidator.isString(arg) ||
        TypeValidator.isAnsiColoredString(arg)
      )
        return arg
      return `${prefix}${String(arg)}\x1b[0m`
    })
  }

  protected _output(consoleMethod: ConsoleMethod, args: unknown[]): void {
    if (consoleMethod === 'trace') {
      this._printCleanTrace(args)
    } else {
      console[consoleMethod](...args)
    }
  }

  protected _processArgs(args: unknown[]): unknown[] {
    const processedArgs: unknown[] = []
    let previousWasObject = false

    for (const arg of args) {
      if (TypeValidator.isFormattableObject(arg)) {
        processedArgs.push(`\n${this._formatValue(arg)}`)
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
    return false
  }

  protected override _toAnsiPrefix(hex: string): string {
    if (
      this._colorLevel === ColorLevel.NO_COLOR ||
      this._colorLevel === 'UnknownEnv'
    ) {
      return ''
    }

    switch (this._colorLevel) {
      case ColorLevel.TRUECOLOR: {
        const [r, g, b] = colorConverter.hex.toRgb(hex)
        return `\x1b[38;2;${r};${g};${b}m`
      }
      case ColorLevel.ANSI256: {
        const code = colorConverter.hex.toAnsi256(hex)
        return `\x1b[38;5;${code}m`
      }
      case ColorLevel.ANSI:
      default: {
        const code = colorConverter.hex.toAnsi16(hex)
        return `\x1b[${code}m`
      }
    }
  }
}
