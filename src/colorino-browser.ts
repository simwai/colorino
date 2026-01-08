import { AbstractColorino } from './abstract-colorino.js'
import { ColorLevel } from './enums.js'
import {
  ConsoleMethod,
  ColorinoBrowserObject,
  Palette,
  BrowserCssArg,
  CssConsoleStyle,
  ColorinoBrowserCss,
} from './types.js'
import { ColorinoBrowserInterface, ColorinoOptions } from './interfaces.js'
import { TypeValidator } from './type-validator.js'
import { InputValidator } from './input-validator.js'

export class ColorinoBrowser
  extends AbstractColorino
  implements ColorinoBrowserInterface
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

  public gradient(
    text: string,
    startHex: string,
    endHex: string
  ): string | BrowserCssArg {
    if (
      this._colorLevel === ColorLevel.NO_COLOR ||
      this._colorLevel === 'UnknownEnv'
    ) {
      return text
    }

    const css = `background: linear-gradient(to right, ${startHex}, ${endHex}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`

    return {
      [ColorinoBrowserCss]: true,
      text,
      css,
    }
  }

  public css(text: string, style: CssConsoleStyle): string | BrowserCssArg {
    if (
      this._colorLevel === ColorLevel.NO_COLOR ||
      this._colorLevel === 'UnknownEnv'
    ) {
      return text
    }

    const css = this._normalizeCssStyle(style)

    return {
      [ColorinoBrowserCss]: true,
      text,
      css,
    }
  }

  protected _normalizeCssStyle(style: CssConsoleStyle): string {
    if (TypeValidator.isString(style)) return style

    const parts: string[] = []

    for (const propertyName in style) {
      if (!Object.prototype.hasOwnProperty.call(style, propertyName)) {
        continue
      }

      const value = style[propertyName]
      if (!value) continue

      parts.push(`${propertyName}:${value}`)
    }

    return parts.join(';')
  }

  protected _applyColors(
    consoleMethod: ConsoleMethod,
    args: unknown[]
  ): unknown[] {
    const formatParts: string[] = []
    const formatArgs: unknown[] = []

    const paletteHex = this._palette[consoleMethod]

    for (const arg of args) {
      if (TypeValidator.isBrowserColorizedArg(arg)) {
        formatParts.push(`%c${arg.text}`)
        formatArgs.push(`color:${arg.hex}`)
        continue
      }

      if (TypeValidator.isBrowserCssArg(arg)) {
        formatParts.push(`%c${arg.text}`)
        formatArgs.push(arg.css)
        continue
      }

      if (TypeValidator.isBrowserObjectArg(arg)) {
        formatParts.push('%o')
        formatArgs.push(arg.value)
        continue
      }

      if (TypeValidator.isString(arg)) {
        formatParts.push(`%c${arg}`)
        formatArgs.push(`color:${paletteHex}`)
        continue
      }

      // Fallback: non-string, non-wrapper → log as object
      formatParts.push('%o')
      formatArgs.push(arg)
    }

    if (formatParts.length === 0) return args

    return [formatParts.join(''), ...formatArgs]
  }

  protected _output(consoleMethod: ConsoleMethod, args: unknown[]): void {
    console[consoleMethod](...args)
  }

  protected _processArgs(args: unknown[]): unknown[] {
    const processedArgs: unknown[] = []
    let previousWasObject = false

    for (const arg of args) {
      if (
        TypeValidator.isBrowserColorizedArg(arg) ||
        TypeValidator.isBrowserCssArg(arg)
      ) {
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
