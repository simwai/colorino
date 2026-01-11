import {
  type Palette,
  type LogLevel,
  ConsoleMethod,
  ColorinoBrowserColorized,
  BrowserColorizedArg,
  BrowserCssArg,
} from './types.js'
import { type ColorinoOptions } from './interfaces.js'
import { InputValidator } from './input-validator.js'
import { ColorLevel } from './enums.js'
import { TypeValidator } from './type-validator.js'

export abstract class AbstractColorino {
  protected alreadyWarned = false
  protected colorLevel: ColorLevel | 'UnknownEnv'
  protected palette: Palette

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
  }
  log(...args: unknown[]): void {
    this.out('log', args)
  }
  info(...args: unknown[]): void {
    this.out('info', args)
  }
  warn(...args: unknown[]): void {
    this.out('warn', args)
  }
  error(...args: unknown[]): void {
    this.out('error', args)
  }
  trace(...args: unknown[]): void {
    this.out('trace', args)
  }
  debug(...args: unknown[]): void {
    this.out('debug', args)
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

  protected abstract applyColors(
    consoleMethod: ConsoleMethod,
    args: unknown[]
  ): unknown[]

  protected abstract processArgs(args: unknown[]): unknown[]
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

  protected filterStack(inputStack: string | Error | undefined): string {
    const stack = TypeValidator.isError(inputStack)
      ? inputStack.stack
      : TypeValidator.isStackLikeString(inputStack)
        ? inputStack
        : ''
    if (!stack) return ''

    return stack
      .split('\n')
      .filter(line => {
        const lower = line.toLowerCase()
        return !lower.includes('colorino')
      })
      .join('\n')
  }

  protected cleanErrorStack(error: Error): Error {
    if (!error.stack) return error

    const cleanStack = this.filterStack(error.stack)

    const cloned = Object.create(Object.getPrototypeOf(error)) as Error
    Object.assign(cloned, error)
    cloned.stack = cleanStack

    return cloned
  }

  protected out(level: LogLevel, args: unknown[]): void {
    const consoleMethod = TypeValidator.isConsoleMethod(level) ? level : 'log'
    const processedArgs = this.processArgs(args)

    if (
      this.colorLevel === ColorLevel.NO_COLOR ||
      this.colorLevel === 'UnknownEnv'
    ) {
      console[consoleMethod](...processedArgs)
      return
    }

    const coloredArgs = this.applyColors(consoleMethod, processedArgs)
    console[consoleMethod](...coloredArgs)
  }
}
