import {
  type Palette,
  ConsoleMethod,
  ColorinoBrowserColorized,
  BrowserColorizedArg,
  BrowserCssArg,
  LogLevel,
  LOG_LEVEL_PRIORITY,
  CallSiteInfo,
  FormattedTag,
} from './types.js'
import { type ColorinoOptions, CallSiteConfig } from './interfaces.js'
import { InputValidator } from './input-validator.js'
import { ColorLevel } from './enums.js'
import { TypeValidator } from './type-validator.js'

export abstract class AbstractColorino {
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

    const validateOptionsResult = this.validator.validateOptions(this.options)
    if (validateOptionsResult.isErr()) throw validateOptionsResult.error

    this.colorLevel = colorLevel
  }

  log(...args: unknown[]): void {
    this.logInternal('log', args)
  }

  info(...args: unknown[]): void {
    this.logInternal('info', args)
  }

  warn(...args: unknown[]): void {
    this.logInternal('warn', args)
  }

  error(...args: unknown[]): void {
    this.logInternal('error', args)
  }

  trace(...args: unknown[]): void {
    this.logInternal('trace', args)
  }

  debug(...args: unknown[]): void {
    this.logInternal('debug', args)
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

  protected logInternal(level: LogLevel, args: unknown[]): void {
    if (!this.isLevelEnabled(level)) return

    const caller = this.captureCaller(4)
    const tags = this.buildMetadataTags(level, caller)
    const formatted = this.formatArgs(this.mapLogLevelToConsoleMethod(level), args, tags)

    const consoleMethod = this.mapLogLevelToConsoleMethod(level)
    console[consoleMethod](...formatted)

    if (!this.isBrowser() && this.options.fileLogging?.isEnabled) {
      this.writeToFile(level, args, caller)
    }
  }

  protected abstract writeToFile(level: LogLevel, args: unknown[], caller?: CallSiteInfo): void

  private isLevelEnabled(level: LogLevel): boolean {
    const { logLevel } = this.options
    if (!logLevel) return true

    const allLevels: LogLevel[] = ['trace', 'debug', 'log', 'info', 'warn', 'error']
    const candidates = logLevel.allow ?? allLevels
    if (!candidates.includes(level)) return false

    const min = logLevel.min ?? 'trace'
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[min]) return false

    if (logLevel.deny?.includes(level)) return false

    return true
  }

  private mapLogLevelToConsoleMethod(level: LogLevel): ConsoleMethod {
    if (level === 'log') return 'log'
    if (level === 'info') return 'info'
    if (level === 'warn') return 'warn'
    if (level === 'error') return 'error'
    if (level === 'trace') return 'trace'
    if (level === 'debug') return 'debug'
    return 'log'
  }

  private captureCaller(stackDepth: number): CallSiteInfo | undefined {
    const config = this.options.metadata?.callSite
    const isEnabledDefault = this.isBrowser() ? false : false // CHANGED TO FALSE
    const isEnabled = config?.isEnabled ?? isEnabledDefault

    if (!isEnabled) return undefined

    const error = new Error()
    const stack = error.stack
    if (!stack) return undefined

    const lines = stack.split('\n')
    const line = lines[stackDepth] || lines[lines.length - 1]
    if (!line) return undefined

    return this.parseStackLine(line)
  }

  protected parseStackLine(line: string): CallSiteInfo | undefined {
    const v8Regex = /at\s+(?:async\s+)?(?:new\s+)?(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?/
    const match = line.match(v8Regex)

    if (!match) return undefined

    const functionName = match[1]
    const fullPath = match[2]
    const lineNumber = parseInt(match[3], 10)
    const columnNumber = parseInt(match[4], 10)

    let info: CallSiteInfo = {
      filename: this.extractFilename(fullPath),
      relativePath: this.extractRelativePath(fullPath),
      line: lineNumber,
      column: columnNumber,
      functionName,
    }

    if (this.options.metadata?.callSite?.resolve) {
      const resolved = this.options.metadata.callSite.resolve({
        file: info.filename,
        line: info.line,
        column: info.column,
        functionName: info.functionName,
      })
      info = {
        ...info,
        filename: resolved.file,
        line: resolved.line,
        column: resolved.column,
        functionName: resolved.functionName,
      }
    }

    return info
  }

  private extractFilename(path: string): string {
    const cleanedPath = path.replace(/^(?:https?|file):\/\//, '')
    const parts = cleanedPath.split(/[/\\]/)
    const lastPart = parts[parts.length - 1]
    return lastPart.split(/[?#]/)[0]
  }

  private extractRelativePath(path: string): string {
    if (this.isBrowser()) return this.extractFilename(path)

    try {
      if (typeof process !== 'undefined' && process.cwd) {
        const cwd = process.cwd()
        if (path.startsWith(cwd)) {
          return path.slice(cwd.length).replace(/^[/\\]/, '').replace(/\\/g, '/')
        }
      }
    } catch (e) {}

    return this.extractFilename(path)
  }

  private buildMetadataTags(level: LogLevel, caller?: CallSiteInfo): FormattedTag[] {
    const tags: FormattedTag[] = []
    const config = this.options.metadata?.callSite

    const isEnabledDefault = this.isBrowser() ? false : false // CHANGED TO FALSE
    const isEnabled = config?.isEnabled ?? isEnabledDefault

    if (isEnabled && caller) {
      const tag = this.formatCallSiteTag(caller, config || {})
      if (tag) tags.push(tag)
    }

    return tags
  }

  private formatCallSiteTag(caller: CallSiteInfo, config: CallSiteConfig): FormattedTag | null {
    const parts: string[] = []
    const isFileVisible = config.isCallerFileVisible ?? true
    const isFunctionVisible = config.isCallerFunctionVisible ?? false
    const isLineVisible = config.isCallerLineVisible ?? true
    const isColumnVisible = config.isCallerColumnVisible ?? true
    const isRelative = config.isCallerPathRelative ?? false

    let filePart = ''
    if (isFileVisible) {
      filePart = isRelative ? caller.relativePath : caller.filename
    }

    let lineColPart = ''
    if (isLineVisible) {
      lineColPart = isColumnVisible ? `${caller.line}:${caller.column}` : `${caller.line}`
    }

    let locationPart = ''
    if (filePart && lineColPart) {
      locationPart = `${filePart}:${lineColPart}`
    } else {
      locationPart = filePart || lineColPart
    }

    let text = ''
    if (isFunctionVisible && caller.functionName) {
      text = locationPart ? `[${caller.functionName}@${locationPart}]` : `[${caller.functionName}]`
    } else if (locationPart) {
      text = `[${locationPart}]`
    }

    if (!text) return null

    return {
      text,
      position: config.position ?? 'postfix',
    }
  }

  protected partitionTags(tags: FormattedTag[]): { prefix: FormattedTag[]; postfix: FormattedTag[] } {
    const prefix: FormattedTag[] = []
    const postfix: FormattedTag[] = []

    for (const tag of tags) {
      if (tag.position === 'prefix') prefix.push(tag)
      else postfix.push(tag)
    }

    return { prefix, postfix }
  }

  protected abstract formatArgs(
    consoleMethod: ConsoleMethod,
    args: unknown[],
    tags: FormattedTag[]
  ): unknown[]

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
