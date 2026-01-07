import { AbstractColorino } from './abstract-colorino.js'
import { ColorLevel } from './enums.js'
import { ConsoleMethod } from './types.js'
import { TypeValidator } from './type-validator.js'
import { colorConverter } from './color-converter.js'
import { Palette, ColorinoOptions } from './types.js'
import { InputValidator } from './input-validator.js'

export class ColorinoNode extends AbstractColorino {
  constructor(
    initialPalette: Palette,
    userPalette: Partial<Palette>,
    validator: InputValidator,
    colorLevel: ColorLevel | 'UnknownEnv',
    options: ColorinoOptions = {}
  ) {
    super(initialPalette, userPalette, validator, colorLevel, options)
    this._maybeWarnUser()
  }

  protected applyColors(
    consoleMethod: ConsoleMethod,
    args: unknown[]
  ): unknown[] {
    const paletteHex = this._palette[consoleMethod]
    const prefix = this._toAnsiPrefix(paletteHex)

    if (!prefix) return args

    return args.map(arg => {
      if (!TypeValidator.isString(arg)) return arg
      if (TypeValidator.isAnsiColoredString(arg)) return arg
      return `${prefix}${String(arg)}\x1b[0m`
    })
  }

  protected output(consoleMethod: ConsoleMethod, args: unknown[]): void {
    if (consoleMethod === 'trace') {
      this._printCleanTrace(args)
    } else {
      console[consoleMethod](...args)
    }
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
        processedArgs.push(`\n${this._formatValue(arg)}`)
        previousWasObject = true
      } else if (TypeValidator.isError(arg)) {
        processedArgs.push('\n', this._cleanErrorStack(arg))
        previousWasObject = true
      } else {
        if (TypeValidator.isString(arg) && previousWasObject) {
          processedArgs.push(`\n${arg}`)
        } else {
          processedArgs.push(arg)
        }
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

  private _maybeWarnUser(): void {
    if (this._alreadyWarned) return
    this._alreadyWarned = true
    console.warn(
      'No ANSI color support detected in this terminal. See https://github.com/chalk/supports-color#support-matrix to learn how to enable terminal color.'
    )
  }
}
