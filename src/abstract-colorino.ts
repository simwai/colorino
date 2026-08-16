import {
  type Palette,
  ConsoleMethod,
  LogLevel,
  ColorinoBrowserColorized,
  BrowserColorizedArg,
  BrowserCssArg,
} from './types.js'
import { type ColorinoOptions } from './interfaces.js'
import { InputValidator } from './input-validator.js'
import { ColorLevel, logSeverity } from './enums.js'
import { TypeValidator } from './type-validator.js'

export abstract class AbstractColorino {
  protected colorLevel: ColorLevel | 'UnknownEnv'
  protected palette: Palette
  protected logLevel: LogLevel

  protected constructor(
    initialPalette: Palette,
    protected readonly userPalette: Partial<Palette>,
    protected readonly validator: InputValidator,
    colorLevel: ColorLevel | 'UnknownEnv',
    protected readonly options: ColorinoOptions = {}
  ) {
    this.palette = initialPalette

    const validatePaletteResult = this.validator.validatePalette(this.palette)
    if (validatePaletteResult.isErr()) throw validatePaletteResult.error

    this.colorLevel = colorLevel
    this.logLevel = this.resolveLogLevel(options.level)
  }

  log(...args: unknown[]): void {
    if (!this.isEnabled('log')) return

    const formatted = this.formatArgs('log', args)
    console.log(...formatted)
    this.writeToFile('log', formatted)
  }

  info(...args: unknown[]): void {
    if (!this.isEnabled('info')) return

    const formatted = this.formatArgs('info', args)
    console.info(...formatted)
    this.writeToFile('info', formatted)
  }

  warn(...args: unknown[]): void {
    if (!this.isEnabled('warn')) return

    const formatted = this.formatArgs('warn', args)
    console.warn(...formatted)
    this.writeToFile('warn', formatted)
  }

  error(...args: unknown[]): void {
    if (!this.isEnabled('error')) return

    const formatted = this.formatArgs('error', args)
    console.error(...formatted)
    this.writeToFile('error', formatted)
  }

  trace(...args: unknown[]): void {
    if (!this.isEnabled('trace')) return

    const formatted = this.formatArgs('trace', args)
    console.log(...formatted)
    this.writeToFile('trace', formatted)
  }

  debug(...args: unknown[]): void {
    if (!this.isEnabled('debug')) return

    const formatted = this.formatArgs('debug', args)
    console.debug(...formatted)
    this.writeToFile('debug', formatted)
  }

  setLevel(level: LogLevel): void {
    this.logLevel = this.resolveLogLevel(level)
  }

  getLevel(): LogLevel {
    return this.logLevel
  }

  colorize(text: string, hex: string): string | BrowserColorizedArg {
    if (
      this.colorLevel === ColorLevel.NO_COLOR ||
      this.colorLevel === 'UnknownEnv'
    ) {
      return text
    }

    if (this.isBrowser()) {
      return {
        [ColorinoBrowserColorized]: true,
        text,
        hex,
      }
    }

    const ansiPrefix = this.toAnsiPrefix(hex)
    if (!ansiPrefix) return text

    return `${ansiPrefix}${text}\x1b[0m`
  }

  protected abstract formatArgs(
    consoleMethod: ConsoleMethod,
    args: unknown[]
  ): unknown[]

  protected writeToFile(_level: ConsoleMethod, _args: unknown[]): void {}

  protected isEnabled(level: ConsoleMethod): boolean {
    return logSeverity[level] >= logSeverity[this.logLevel]
  }

  private resolveLogLevel(level: LogLevel | undefined): LogLevel {
    const resolved = level ?? 'trace'
    const validateLogLevelResult = this.validator.validateLogLevel(resolved)
    if (validateLogLevelResult.isErr()) throw validateLogLevelResult.error

    return resolved
  }

  protected abstract isBrowser(): boolean

  protected abstract gradient(
    text: string,
    startHex: string,
    endHex: string
  ): string | BrowserCssArg

  protected toAnsiPrefix(_hex: string): string {
    return ''
  }

  protected formatValue(
    value: unknown,
    maxDepth = this.options.maxDepth ?? 5
  ): string {
    const seen = new WeakSet<object>()
    const sanitization = this.options.sanitization
    const sensitiveKeys = new Set(
      sanitization?.keys ?? [
        'apiKey',
        'authorization',
        'cookie',
        'password',
        'privateKey',
        'secret',
        'token',
      ]
    )
    const replacement = sanitization?.replacement ?? '[REDACTED]'

    const sanitizeArray = (items: unknown[], depth: number): unknown[] => {
      return items.map(item => sanitize(item, depth))
    }

    const sanitizeObject = (
      obj: Record<string, unknown>,
      depth: number
    ): Record<string, unknown> => {
      const result: Record<string, unknown> = {}
      for (const key in obj) {
        if (
          (sanitization?.enabled ?? true) &&
          [...sensitiveKeys].some(
            sensitiveKey => sensitiveKey.toLowerCase() === key.toLowerCase()
          )
        ) {
          result[key] = replacement
          continue
        }

        try {
          result[key] = sanitize(obj[key], depth)
        } catch {
          result[key] = '[Unreadable]'
        }
      }
      return result
    }

    const sanitize = (val: unknown, currentDepth: number): unknown => {
      if (TypeValidator.isNullOrUndefined(val)) {
        return val
      }

      if (typeof val === 'bigint') return `${val}n`
      if (typeof val === 'symbol') return val.toString()
      if (typeof val === 'function')
        return `[Function: ${val.name || 'anonymous'}]`
      if (!TypeValidator.isObject(val)) return val

      if (seen.has(val)) return '[Circular]'
      seen.add(val)

      if (currentDepth >= maxDepth) return '[Object]'

      const nextDepth = currentDepth + 1

      if (val instanceof Date) {
        try {
          return val.toISOString()
        } catch {
          return '[Invalid Date]'
        }
      }
      if (val instanceof RegExp) return val.toString()

      if (val instanceof Map) {
        return sanitizeObject(Object.fromEntries(val), nextDepth)
      }

      if (val instanceof Set) return sanitizeArray([...val], nextDepth)

      if (TypeValidator.isArray(val)) {
        return sanitizeArray(val as unknown[], nextDepth)
      }

      return sanitizeObject(val, nextDepth)
    }

    try {
      return JSON.stringify(sanitize(value, 0), null, 2) ?? 'undefined'
    } catch {
      return '[Unserializable]'
    }
  }

  protected filterStack(inputStack: string | Error | undefined): string {
    const areNodeFramesShown = this.options.areNodeFramesVisible ?? true
    const areColorinoFramesShown =
      this.options.areColorinoFramesVisible ?? false

    const stack = TypeValidator.isError(inputStack)
      ? inputStack.stack
      : TypeValidator.isStackLikeString(inputStack)
        ? inputStack
        : ''
    if (!stack) return ''

    const lines = stack.split('\n')
    const firstLine = lines[0] || ''

    const isErrorHeader = !firstLine.trim().startsWith('at ')
    const startIndex = isErrorHeader ? 1 : 0

    const filtered = lines.slice(startIndex).filter(line => {
      const lower = line.toLowerCase()

      if (
        (!areColorinoFramesShown && lower.includes('colorino')) ||
        (!areNodeFramesShown && lower.includes('node:'))
      ) {
        return false
      }

      return true
    })

    return isErrorHeader
      ? [firstLine, ...filtered].join('\n')
      : filtered.join('\n')
  }

  protected cleanErrorStack(error: Error): Error {
    if (!error.stack) return error

    const cleanStack = this.filterStack(error.stack)
    error.stack = cleanStack

    return error
  }

  protected buildCallerStack(): string | undefined {
    const error = new Error('Trace')

    if (!error.stack) return undefined

    const lines = error.stack.split('\n')
    const stackFrames = lines.slice(1).join('\n')

    return this.filterStack(stackFrames)
  }
}
