import {
  BrowserColorizedArg,
  BrowserCssArg,
  BrowserObjectArg,
  ColorinoBrowserColorized,
  ColorinoBrowserCss,
  ColorinoBrowserObject,
  ConsoleMethod,
} from './types.js'

export class TypeValidator {
  static isNull(value: unknown): value is null {
    return value === null
  }

  static isUndefined(value: unknown): value is undefined {
    return value === undefined
  }

  static isNullOrUndefined(value: unknown): value is null | undefined {
    return value == null
  }

  static isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }

  static isString(value: unknown): value is string | string {
    return typeof value === 'string' || value instanceof String
  }

  static isArray(value: unknown): value is unknown[] {
    return Array.isArray(value)
  }

  static isError(value: unknown): value is Error {
    return value instanceof Error
  }

  static isBrowserColorizedArg(value: unknown): value is BrowserColorizedArg {
    return TypeValidator.isObject(value) && ColorinoBrowserColorized in value
  }

  static isBrowserCssArg(value: unknown): value is BrowserCssArg {
    return (
      typeof value === 'object' &&
      value !== null &&
      ColorinoBrowserCss in value &&
      (value as BrowserCssArg)[ColorinoBrowserCss] === true
    )
  }

  static isBrowserObjectArg(value: unknown): value is BrowserObjectArg {
    return TypeValidator.isObject(value) && ColorinoBrowserObject in value
  }

  static isAnsiColoredString(value: unknown): value is string {
    // eslint-disable
    return (
      TypeValidator.isString(value) && /\x1b\[[0-9;]*m/.test(value.toString())
    )
  }

  static isFormattableObject(value: unknown): value is Record<string, unknown> {
    return (
      TypeValidator.isObject(value) &&
      !TypeValidator.isError(value) &&
      !TypeValidator.isBrowserColorizedArg(value) &&
      !TypeValidator.isString(value)
    )
  }

  static isStackLikeString(value: unknown): value is string {
    if (!TypeValidator.isString(value)) return false

    const text = value.toString()
    if (!text.includes('\n')) return false

    const lines = text.split('\n').map(line => line.trim())
    let stackFrameLines = 0

    for (const line of lines) {
      if (!line) continue

      // Typical Node / browser stack lines start with "at "
      if (line.startsWith('at ')) {
        stackFrameLines++
      } else if (line.match(/:\d+:\d+\)?$/)) {
        // Fallback: "file.js:10:5" style
        stackFrameLines++
      }

      if (stackFrameLines >= 2) {
        return true
      }
    }

    return false
  }

  static isConsoleMethod(level: string): level is ConsoleMethod {
    return ['log', 'info', 'warn', 'error', 'trace', 'debug'].includes(level)
  }
}
