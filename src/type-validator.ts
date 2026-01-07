import {
  BrowserColorizedArg,
  BrowserObjectArg,
  ColorinoBrowserColorized,
  ColorinoBrowserObject,
  ConsoleMethod,
} from './types.js'

export class TypeValidator {
  static isNull(value: unknown): value is null {
    return value === null
  }

  static isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }

  static isString(value: unknown): value is string {
    return typeof value === 'string'
  }

  static isError(value: unknown): value is Error {
    return value instanceof Error
  }

  static isBrowserColorizedArg(value: unknown): value is BrowserColorizedArg {
    return (
      typeof value === 'object' &&
      value !== null &&
      ColorinoBrowserColorized in value
    )
  }

  static isBrowserObjectArg(value: unknown): value is BrowserObjectArg {
    return (
      typeof value === 'object' &&
      value !== null &&
      ColorinoBrowserObject in value
    )
  }

  static isAnsiColoredString(value: unknown): value is string {
    // oxlint-disable-next-line no-control-regex
    return TypeValidator.isString(value) && /\x1b\[[0-9;]*m/.test(value)
  }

  static isFormattableObject(value: unknown): value is Record<string, unknown> {
    return (
      TypeValidator.isObject(value) &&
      !TypeValidator.isError(value) &&
      !TypeValidator.isBrowserColorizedArg(value)
    )
  }

  static isConsoleMethod(level: string): level is ConsoleMethod {
    return ['log', 'info', 'warn', 'error', 'trace', 'debug'].includes(level)
  }
}
