import {
  type Palette,
  type LogLevel,
  ConsoleMethod,
  ColorinoBrowserColorized,
  BrowserColorizedArg,
} from './types.js'
import { type ColorinoOptions } from './interfaces.js'
import { InputValidator } from './input-validator.js'
import { ColorLevel } from './enums.js'
import { TypeValidator } from './type-validator.js'

export abstract class AbstractColorino {
  protected _alreadyWarned = false
  protected _colorLevel: ColorLevel | 'UnknownEnv'
  protected _palette: Palette

  protected constructor(
    initialPalette: Palette,
    protected readonly _userPalette: Partial<Palette>,
    protected readonly _validator: InputValidator,
    colorLevel: ColorLevel | 'UnknownEnv',
    protected readonly _options: ColorinoOptions = {}
  ) {
    this._palette = initialPalette

    const validatePaletteResult = this._validator.validatePalette(this._palette)
    if (validatePaletteResult.isErr()) throw validatePaletteResult.error

    this._colorLevel = colorLevel
  }
  log(...args: unknown[]): void {
    this._out('log', args)
  }
  info(...args: unknown[]): void {
    this._out('info', args)
  }
  warn(...args: unknown[]): void {
    this._out('warn', args)
  }
  error(...args: unknown[]): void {
    this._out('error', args)
  }
  trace(...args: unknown[]): void {
    this._out('trace', args)
  }
  debug(...args: unknown[]): void {
    this._out('debug', args)
  }

  colorize(text: string, hex: string): string | BrowserColorizedArg {
    if (
      this._colorLevel === ColorLevel.NO_COLOR ||
      this._colorLevel === 'UnknownEnv'
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

    const ansiPrefix = this._toAnsiPrefix(hex)
    if (!ansiPrefix) {
      return text
    }

    return `${ansiPrefix}${text}\x1b[0m`
  }

  private _out(level: LogLevel, args: unknown[]): void {
    const consoleMethod = TypeValidator.isConsoleMethod(level) ? level : 'log'
    const processedArgs = this._processArgs(args)

    if (
      this._colorLevel === ColorLevel.NO_COLOR ||
      this._colorLevel === 'UnknownEnv'
    ) {
      this._output(consoleMethod, processedArgs)
      return
    }

    const coloredArgs = this._applyColors(consoleMethod, processedArgs)
    this._output(consoleMethod, coloredArgs)
  }
  protected abstract _applyColors(
    consoleMethod: ConsoleMethod,
    args: unknown[]
  ): unknown[]
  protected abstract _output(
    consoleMethod: ConsoleMethod,
    args: unknown[]
  ): void
  protected abstract _processArgs(args: unknown[]): unknown[]
  protected abstract isBrowser(): boolean

  protected _toAnsiPrefix(_hex: string): string {
    return ''
  }

  protected _formatValue(
    value: unknown,
    maxDepth = this._options.maxDepth ?? 5
  ): string {
    const seen = new WeakSet<object>()

    const sanitizeArray = (items: unknown[], depth: number): unknown[] => {
      return items.map(item => sanitize(item, depth))
    }

    const sanitizeObject = (
      obj: Record<string, unknown>,
      depth: number
    ): Record<string, unknown> => {
      const result: Record<string, unknown> = {}
      for (const key in obj) {
        result[key] = sanitize(obj[key], depth)
      }
      return result
    }

    const sanitize = (val: unknown, currentDepth: number): unknown => {
      if (
        TypeValidator.isNullOrUndefined(val) ||
        !TypeValidator.isObject(val)
      ) {
        return val
      }

      if (seen.has(val)) return '[Circular]'
      seen.add(val)

      if (currentDepth >= maxDepth) return '[Object]'

      const nextDepth = currentDepth + 1

      if (TypeValidator.isArray(val)) {
        return sanitizeArray(val as unknown[], nextDepth)
      }

      return sanitizeObject(val as Record<string, unknown>, nextDepth)
    }

    return JSON.stringify(sanitize(value, 0), null, 2)
  }

  protected _filterStack(stack: string): string {
    return stack
      .split('\n')
      .filter(line => !line.match(/.*colorino.*/gi))
      .join('\n')
  }

  protected _cleanErrorStack(error: Error): Error {
    if (!error.stack) return error

    const cleanStack = this._filterStack(error.stack)

    const cloned = Object.create(Object.getPrototypeOf(error)) as Error
    Object.assign(cloned, error)
    cloned.stack = cleanStack

    return cloned
  }

  protected _printCleanTrace(args: unknown[]): void {
    const error = new Error()

    if (error.stack) {
      const cleanStack = this._filterStack(error.stack)
      console.log(...args, `\n${cleanStack}`)
    } else {
      console.log(...args)
    }
  }
}
