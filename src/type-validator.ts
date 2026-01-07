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
      !TypeValidator.isString(value) // Treat String objects as strings, not general objects
    )
  }

  static isConsoleMethod(level: string): level is ConsoleMethod {
    return ['log', 'info', 'warn', 'error', 'trace', 'debug'].includes(level)
  }
}