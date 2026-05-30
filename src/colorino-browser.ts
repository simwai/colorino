import { AbstractColorino } from './abstract-colorino.js'
import { ColorLevel } from './enums.js'
import {
  ConsoleMethod,
  Palette,
  BrowserCssArg,
  CssConsoleStyle,
  ColorinoBrowserCss,
  LogLevel,
  FormattedTag,
  ColorinoBrowserColorized,
} from './types.js'
import { ColorinoBrowserInterface, ColorinoOptions } from './interfaces.js'
import {
  isBrowserColorizedArg,
  isBrowserCssArg,
  isError,
  isFormattableObject,
  isStackLikeString,
  isString,
} from './type-validator.js'

export class ColorinoBrowser
  extends AbstractColorino
  implements ColorinoBrowserInterface
{
  constructor(
    initialPalette: Palette,
    userPalette: Partial<Palette>,
    colorLevel: ColorLevel | 'UnknownEnv',
    options: ColorinoOptions = {}
  ) {
    super(initialPalette, userPalette, colorLevel, options)
  }

  public gradient(
    text: string,
    startHex: string,
    endHex: string
  ): string | BrowserCssArg {
    const isNoColor =
      this.colorLevel === ColorLevel.NO_COLOR ||
      this.colorLevel === 'UnknownEnv'
    if (isNoColor) {
      return text
    }

    const gradientCss = `background: linear-gradient(to right, ${startHex}, ${endHex}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`
    return {
      [ColorinoBrowserCss]: true,
      text,
      css: gradientCss,
    } as BrowserCssArg
  }

  public css(text: string, style: CssConsoleStyle): string | BrowserCssArg {
    const isNoColor =
      this.colorLevel === ColorLevel.NO_COLOR ||
      this.colorLevel === 'UnknownEnv'
    if (isNoColor) {
      return text
    }
    return {
      [ColorinoBrowserCss]: true,
      text,
      css: this.normalizeCssStyle(style),
    } as BrowserCssArg
  }

  protected writeToFile(): void {
    // File logging is not supported in the browser environment
  }

  protected formatArgs(
    method: ConsoleMethod,
    args: unknown[],
    tags: FormattedTag[] = []
  ): unknown[] {
    const hasError = args.some(arg => isError(arg) || isStackLikeString(arg))
    const argsToProcess =
      method === 'trace' && !hasError
        ? (() => {
            const stack = this.buildCallerStack()
            return stack ? [...args, stack] : args
          })()
        : args

    const colorHex = this.palette[method] || '#ffffff'
    const formatStringParts: string[] = []
    const finalArguments: unknown[] = []

    const { prefix, postfix } = this.partitionTags(tags)

    // Prepend prefix tags
    for (const tag of prefix) {
      formatStringParts.push('%c%s')
      finalArguments.push(`color:${colorHex}`, tag.text)
    }

    let lastWasObject = false
    for (const arg of argsToProcess) {
      if (isBrowserColorizedArg(arg)) {
        formatStringParts.push(`%c${arg.text}`)
        finalArguments.push(`color:${arg.hex}`)
        lastWasObject = false
      } else if (isBrowserCssArg(arg)) {
        formatStringParts.push(`%c${arg.text}`)
        finalArguments.push(arg.css)
        lastWasObject = false
      } else if (isFormattableObject(arg)) {
        formatStringParts.push(lastWasObject ? '%o' : '\n%o')
        finalArguments.push(arg)
        lastWasObject = true
      } else if (isError(arg)) {
        const cleanedError = this.cleanErrorStack(arg)
        if (
          !cleanedError.name.trim() ||
          !cleanedError.message.trim() ||
          !cleanedError.stack?.trim()
        ) {
          continue
        }

        const errorHeader = `${cleanedError.name}: ${cleanedError.message}`
        const errorStack = cleanedError.stack.split('\n').slice(1).join('\n')

        formatStringParts.push(lastWasObject ? '%c%s' : '\n%c%s')
        finalArguments.push(`color:${colorHex}`, errorHeader)

        if (errorStack) {
          formatStringParts.push('\n%s')
          finalArguments.push(errorStack)
        }
        lastWasObject = true
      } else if (isStackLikeString(arg)) {
        const filteredStack = this.filterStack(arg)
        if (!filteredStack.trim()) {
          continue
        }

        formatStringParts.push('\n%s')
        finalArguments.push(filteredStack)
        lastWasObject = true
      } else if (isString(arg)) {
        const stringValue = lastWasObject ? `\n${arg}` : arg
        formatStringParts.push(`%c${stringValue}`)
        finalArguments.push(`color:${colorHex}`)
        lastWasObject = false
      } else {
        formatStringParts.push('%o')
        finalArguments.push(arg)
        lastWasObject = false
      }
    }

    // Append postfix tags
    for (const tag of postfix) {
      formatStringParts.push('%c %s')
      finalArguments.push(`color:${colorHex}`, tag.text)
    }

    if (formatStringParts.length === 0) {
      return argsToProcess
    }

    return [formatStringParts.join(' '), ...finalArguments]
  }

  protected isBrowser(): boolean {
    return true
  }

  protected normalizeCssStyle(style: CssConsoleStyle): string {
    if (isString(style)) {
      return style
    }

    const styleParts = []
    for (const property in style) {
      if (
        Object.prototype.hasOwnProperty.call(style, property) &&
        style[property]
      ) {
        styleParts.push(`${property}:${style[property]}`)
      }
    }
    return styleParts.join(';')
  }
}
