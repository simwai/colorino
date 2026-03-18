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
  CallSiteInfo,
} from './types.js'
import { ColorinoBrowserInterface, ColorinoOptions } from './interfaces.js'
import { TypeValidator } from './type-validator.js'
import { InputValidator } from './input-validator.js'

export class ColorinoBrowser extends AbstractColorino implements ColorinoBrowserInterface {
  constructor(
    initialPalette: Palette,
    userPalette: Partial<Palette>,
    validator: InputValidator,
    colorLevel: ColorLevel | 'UnknownEnv',
    options: ColorinoOptions = {}
  ) {
    super(initialPalette, userPalette, validator, colorLevel, options)
  }

  public gradient(text: string, startHex: string, endHex: string): string | BrowserCssArg {
    const isNoColor = this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv'
    if (isNoColor) {
      return text
    }

    const css = `background: linear-gradient(to right, ${startHex}, ${endHex}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`
    return { [ColorinoBrowserCss]: true, text, css } as BrowserCssArg
  }

  public css(text: string, style: CssConsoleStyle): string | BrowserCssArg {
    const isNoColor = this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv'
    if (isNoColor) {
      return text
    }
    return {
      [ColorinoBrowserCss]: true,
      text,
      css: this.normalizeCssStyle(style)
    } as BrowserCssArg
  }

  protected writeToFile(): void {
    // File logging is not supported in the browser
  }

  protected formatArgs(method: ConsoleMethod, args: unknown[], tags: FormattedTag[] = []): unknown[] {
    const hasError = args.some(arg => TypeValidator.isError(arg) || TypeValidator.isStackLikeString(arg))
    const toProcess = (method === 'trace' && !hasError)
      ? (() => {
          const stack = this.buildCallerStack()
          return stack ? [...args, stack] : args
        })()
      : args

    const colorHex = this.palette[method] || '#ffffff'
    const formatParts: string[] = []
    const finalArgs: unknown[] = []

    const { prefix, postfix } = this.partitionTags(tags)

    // Add prefix tags
    for (const tag of prefix) {
      formatParts.push('%c%s')
      finalArgs.push(`color:${colorHex}`, tag.text)
    }

    let previousWasObject = false
    for (const arg of toProcess) {
      if (TypeValidator.isBrowserColorizedArg(arg)) {
        formatParts.push(`%c${arg.text}`)
        finalArgs.push(`color:${arg.hex}`)
        previousWasObject = false
      } else if (TypeValidator.isBrowserCssArg(arg)) {
        formatParts.push(`%c${arg.text}`)
        finalArgs.push(arg.css)
        previousWasObject = false
      } else if (TypeValidator.isFormattableObject(arg)) {
        formatParts.push(previousWasObject ? '%o' : '\n%o')
        finalArgs.push(arg)
        previousWasObject = true
      } else if (TypeValidator.isError(arg)) {
        const cleaned = this.cleanErrorStack(arg)
        if (!cleaned.name.trim() || !cleaned.message.trim() || !cleaned.stack?.trim()) {
          continue
        }

        const header = `${cleaned.name}: ${cleaned.message}`
        const stackLines = cleaned.stack.split('\n').slice(1).join('\n')

        formatParts.push(previousWasObject ? '%c%s' : '\n%c%s')
        finalArgs.push(`color:${colorHex}`, header)

        if (stackLines) {
          formatParts.push('\n%s')
          finalArgs.push(stackLines)
        }
        previousWasObject = true
      } else if (TypeValidator.isStackLikeString(arg)) {
        const filtered = this.filterStack(arg)
        if (!filtered.trim()) {
          continue
        }

        formatParts.push('\n%s')
        finalArgs.push(filtered)
        previousWasObject = true
      } else if (TypeValidator.isString(arg)) {
        const str = previousWasObject ? `\n${arg}` : arg
        formatParts.push(`%c${str}`)
        finalArgs.push(`color:${colorHex}`)
        previousWasObject = false
      } else {
        formatParts.push('%o')
        finalArgs.push(arg)
        previousWasObject = false
      }
    }

    // Add postfix tags
    for (const tag of postfix) {
      formatParts.push('%c %s')
      finalArgs.push(`color:${colorHex}`, tag.text)
    }

    if (formatParts.length === 0) {
      return toProcess
    }

    return [formatParts.join(' '), ...finalArgs]
  }

  protected isBrowser(): boolean {
    return true
  }

  protected normalizeCssStyle(style: CssConsoleStyle): string {
    if (TypeValidator.isString(style)) {
      return style
    }

    const parts = []
    for (const property in style) {
       if (Object.prototype.hasOwnProperty.call(style, property) && style[property]) {
          parts.push(`${property}:${style[property]}`)
       }
    }
    return parts.join(';')
  }
}
