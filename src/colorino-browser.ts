import { AbstractColorino } from './abstract-colorino.js'
import { ColorLevel } from './enums.js'
import {
  ConsoleMethod,
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
      this.colorLevel === ColorLevel.NO_COLOR ||
      this.colorLevel === 'UnknownEnv'
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
      this.colorLevel === ColorLevel.NO_COLOR ||
      this.colorLevel === 'UnknownEnv'
    ) {
      return text
    }

    const css = this.normalizeCssStyle(style)

    return {
      [ColorinoBrowserCss]: true,
      text,
      css,
    }
  }

  protected formatArgs(
    consoleMethod: ConsoleMethod,
    args: unknown[]
  ): unknown[] {
    const hasErrorOrStack = args.some(
      arg => TypeValidator.isError(arg) || TypeValidator.isStackLikeString(arg)
    )

    const argsToProcess =
      consoleMethod === 'trace' && !hasErrorOrStack
        ? (() => {
            const stack = this.buildCallerStack()
            return stack ? [...args, stack] : args
          })()
        : args

    const paletteHex = this.palette[consoleMethod]
    const formatParts: string[] = []
    const formatArgs: unknown[] = []
    let previousWasObject = false

    for (const arg of argsToProcess) {
      if (TypeValidator.isBrowserColorizedArg(arg)) {
        formatParts.push(`%c${arg.text}`)
        formatArgs.push(`color:${arg.hex}`)
        previousWasObject = false
        continue
      }

      if (TypeValidator.isBrowserCssArg(arg)) {
        formatParts.push(`%c${arg.text}`)
        formatArgs.push(arg.css)
        previousWasObject = false
        continue
      }

      if (TypeValidator.isFormattableObject(arg)) {
        if (previousWasObject) {
          formatParts.push('%o')
        } else {
          formatParts.push('\n%o')
        }

        formatArgs.push(arg)
        previousWasObject = true
        continue
      }

      if (TypeValidator.isError(arg)) {
        const cleaned = this.cleanErrorStack(arg)

        if (
          !cleaned.name.trim() ||
          !cleaned.message.trim() ||
          !cleaned.stack?.trim()
        ) {
          continue
        }

        const errorHeader = `${cleaned.name}: ${cleaned.message}`
        const stackFrames = cleaned.stack.split('\n').slice(1).join('\n')

        if (!previousWasObject) {
          formatParts.push('\n%c%s')
        } else {
          formatParts.push('%c%s')
        }

        if (stackFrames) {
          formatParts.push('\n%s')
          formatArgs.push(`color:${paletteHex}`, errorHeader, stackFrames)
        } else {
          formatArgs.push(`color:${paletteHex}`, errorHeader)
        }

        previousWasObject = true
        continue
      }

      if (TypeValidator.isStackLikeString(arg)) {
        const filtered = this.filterStack(arg)

        if (!filtered.trim()) {
          continue
        }

        formatParts.push('\n%s')
        formatArgs.push(filtered)
        previousWasObject = true
        continue
      }

      if (TypeValidator.isString(arg)) {
        const spacedText = previousWasObject ? `\n${arg}` : arg
        formatParts.push(`%c${spacedText}`)
        formatArgs.push(`color:${paletteHex}`)
        previousWasObject = false
        continue
      }

      formatParts.push('%o')
      formatArgs.push(arg)
      previousWasObject = false
    }

    if (formatParts.length === 0) return argsToProcess

    return [formatParts.join(' '), ...formatArgs]
  }

  protected isBrowser(): boolean {
    return true
  }

  protected normalizeCssStyle(style: CssConsoleStyle): string {
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
}
