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
    this.palette = { ...initialPalette, ...userPalette }

    const paletteValidation = this.validator.validatePalette(this.palette)
    if (paletteValidation.isErr()) {
      throw paletteValidation.error
    }

    const optionsValidation = this.validator.validateOptions(this.options)
    if (optionsValidation.isErr()) {
      throw optionsValidation.error
    }

    this.colorLevel = colorLevel
  }

  public log(...args: unknown[]): void { this.logInternal('log', args) }
  public info(...args: unknown[]): void { this.logInternal('info', args) }
  public warn(...args: unknown[]): void { this.logInternal('warn', args) }
  public error(...args: unknown[]): void { this.logInternal('error', args) }
  public trace(...args: unknown[]): void { this.logInternal('trace', args) }
  public debug(...args: unknown[]): void { this.logInternal('debug', args) }
  public fatal(...args: unknown[]): void { this.logInternal('fatal', args) }

  public abstract gradient(text: string, startHex: string, endHex: string): string | BrowserCssArg

  public colorize(text: string, hex: string): string | BrowserColorizedArg {
    if (this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv') {
      return text
    }

    if (this.isBrowser()) {
      return {
        [ColorinoBrowserColorized]: true,
        text,
        hex
      } as BrowserColorizedArg
    }

    const ansiPrefix = this.toAnsiPrefix(hex)
    return ansiPrefix ? `${ansiPrefix}${text}\x1b[0m` : text
  }

  protected logInternal(level: LogLevel, args: unknown[]): void {
    if (!this.isLevelEnabled(level)) return

    const caller = this.captureCaller()
    const tags = this.buildMetadataTags(level, caller)

    const method = this.mapLevelToConsoleMethod(level)
    const formattedArgs = this.formatArgs(method, args, tags)

    const consoleTarget = method === 'trace' ? 'log' : method
    console[consoleTarget](...formattedArgs)

    if (!this.isBrowser() && this.options.fileLogging?.isEnabled) {
      this.writeToFile(level, args, caller)
    }
  }

  private mapLevelToConsoleMethod(level: LogLevel): ConsoleMethod {
    if (level === 'fatal') return 'error'
    if (['log', 'info', 'warn', 'error', 'trace', 'debug'].includes(level)) {
      return level as ConsoleMethod
    }
    return 'log'
  }

  protected abstract writeToFile(level: LogLevel, args: unknown[], caller?: CallSiteInfo): void

  private isLevelEnabled(level: LogLevel): boolean {
    const config = this.options.logLevel
    if (!config) return true

    const allowedLevels = config.allow ?? (Object.keys(LOG_LEVEL_PRIORITY) as LogLevel[])
    if (!allowedLevels.includes(level)) return false

    const minLevel = config.min ?? 'trace'
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[minLevel]) return false

    if (config.deny?.includes(level)) return false

    return true
  }

  private captureCaller(): CallSiteInfo | undefined {
    const config = this.options.metadata?.callSite
    if (!(config?.isEnabled ?? false)) return undefined

    const stack = new Error().stack
    if (!stack) return undefined

    const lines = stack.split('\n')
    let frameLine: string | undefined

    for (let index = 1; index < lines.length; index++) {
      const line = lines[index]
      if (!line) continue
      const lowerLine = line.toLowerCase()
      const isInternal = lowerLine.includes('colorino') || lowerLine.includes('loginternal') || lowerLine.includes('capturecaller')
      if (!isInternal) {
        frameLine = line
        break
      }
    }

    return frameLine ? this.parseStackLine(frameLine) : undefined
  }

  protected parseStackLine(line: string): CallSiteInfo | undefined {
    const parts = line.trim().split(/\s+/)
    let locationString = parts[parts.length - 1]
    if (locationString.startsWith('(') && locationString.endsWith(')')) {
      locationString = locationString.slice(1, -1)
    }

    const lastColonIndex = locationString.lastIndexOf(':')
    if (lastColonIndex === -1) return undefined
    const columnNumber = parseInt(locationString.slice(lastColonIndex + 1), 10)

    const secondLastColonIndex = locationString.lastIndexOf(':', lastColonIndex - 1)
    if (secondLastColonIndex === -1) return undefined
    const lineNumber = parseInt(locationString.slice(secondLastColonIndex + 1, lastColonIndex), 10)

    const rawPath = locationString.slice(0, secondLastColonIndex)
    if (!rawPath) return undefined

    let functionName: string | undefined
    if (parts[1] !== locationString && parts[1] !== 'at') {
      functionName = parts[1]
    }

    const info: CallSiteInfo = {
      filename: this.extractFilename(rawPath),
      relativePath: this.extractRelativePath(rawPath),
      line: lineNumber,
      column: columnNumber,
      functionName
    }

    if (this.options.metadata?.callSite?.resolve) {
      const resolved = this.options.metadata.callSite.resolve({
        file: info.filename,
        line: info.line,
        column: info.column,
        functionName: info.functionName
      })
      return {
        ...info,
        filename: resolved.file,
        line: resolved.line,
        column: resolved.column,
        functionName: resolved.functionName
      }
    }

    return info
  }

  private extractFilename(filePath: string): string {
    const segments = filePath.replace(/^(?:https?|file):\/\//, '').split(/[/\\]/)
    const lastSegment = segments[segments.length - 1] || ''
    return lastSegment.split(/[?#]/)[0] || ''
  }

  private extractRelativePath(filePath: string): string {
    if (this.isBrowser()) return this.extractFilename(filePath)
    try {
      if (typeof process !== 'undefined' && process.cwd) {
        const currentWorkingDirectory = process.cwd()
        const normalizedPath = filePath.replace(/^(?:file):\/\//, '')
        if (normalizedPath.startsWith(currentWorkingDirectory)) {
          return normalizedPath.slice(currentWorkingDirectory.length).replace(/^[/\\]/, '').replace(/\\/g, '/')
        }
      }
    } catch {}
    return this.extractFilename(filePath)
  }

  private buildMetadataTags(_level: LogLevel, caller?: CallSiteInfo): FormattedTag[] {
    const config = this.options.metadata?.callSite
    if ((config?.isEnabled ?? false) && caller) {
      const tag = this.formatCallSiteTag(caller, config || {})
      return tag ? [tag] : []
    }
    return []
  }

  private formatCallSiteTag(caller: CallSiteInfo, config: CallSiteConfig): FormattedTag | null {
    const isFileVisible = config.isCallerFileVisible ?? true
    const isFunctionVisible = config.isCallerFunctionVisible ?? false
    const isLineVisible = config.isCallerLineVisible ?? true
    const isColumnVisible = config.isCallerColumnVisible ?? true
    const isPathRelative = config.isCallerPathRelative ?? false

    const filePart = isFileVisible ? (isPathRelative ? caller.relativePath : caller.filename) : ''
    const linePart = isLineVisible ? (isColumnVisible ? `${caller.line}:${caller.column}` : `${caller.line}`) : ''
    const location = filePart && linePart ? `${filePart}:${linePart}` : (filePart || linePart)

    let tagText = ''
    if (isFunctionVisible && caller.functionName) {
      tagText = location ? `[${caller.functionName}@${location}]` : `[${caller.functionName}]`
    } else if (location) {
      tagText = `[${location}]`
    }

    return tagText ? { text: tagText, position: config.position ?? 'postfix' } : null
  }

  protected partitionTags(tags: FormattedTag[]): { prefix: FormattedTag[]; postfix: FormattedTag[] } {
    const prefix: FormattedTag[] = [], postfix: FormattedTag[] = []
    for (const tag of tags) {
      if (tag.position === 'prefix') prefix.push(tag)
      else postfix.push(tag)
    }
    return { prefix, postfix }
  }

  protected abstract formatArgs(method: ConsoleMethod, args: unknown[], tags: FormattedTag[]): unknown[]
  protected abstract isBrowser(): boolean
  protected abstract gradient(text: string, start: string, end: string): string | BrowserCssArg
  protected toAnsiPrefix(_hex: string): string { return '' }

  protected formatValue(value: unknown, maxDepth = this.options.maxDepth ?? 5): string {
    const visited = new WeakSet<object>()
    const transform = (currentValue: unknown, depth: number): unknown => {
      if (TypeValidator.isNullOrUndefined(currentValue) || !TypeValidator.isObject(currentValue)) {
        if (typeof currentValue === 'bigint') return `${currentValue.toString()}n`
        return currentValue
      }
      if (visited.has(currentValue)) return '[Circular]'
      visited.add(currentValue)
      if (depth >= maxDepth) return '[Object]'

      if (TypeValidator.isArray(currentValue)) {
        return currentValue.map(item => transform(item, depth + 1))
      }
      const result: Record<string, unknown> = {}
      for (const key in currentValue) {
        if (Object.prototype.hasOwnProperty.call(currentValue, key)) {
          result[key] = transform(currentValue[key], depth + 1)
        }
      }
      visited.delete(currentValue)
      return result
    }
    return JSON.stringify(transform(value, 0), null, 2)
  }

  protected filterStack(input: string | Error | undefined): string {
    const areNodeFramesVisible = this.options.areNodeFramesVisible ?? true
    const areColorinoFramesVisible = this.options.areColorinoFramesVisible ?? false
    const stackString = TypeValidator.isError(input) ? input.stack : (TypeValidator.isStackLikeString(input) ? input : '')
    if (!stackString) return ''

    const lines = stackString.split('\n')
    const header = lines[0] || ''
    const isErrorHeader = !header.trim().startsWith('at ')

    const frames = lines.slice(isErrorHeader ? 1 : 0).filter(line => {
      const lowerLine = line.toLowerCase()
      const isInternal = !areColorinoFramesVisible && lowerLine.includes('colorino')
      const isNodeInternal = !areNodeFramesVisible && lowerLine.includes('node:')
      return !(isInternal || isNodeInternal)
    })

    return isErrorHeader ? [header, ...frames].join('\n') : frames.join('\n')
  }

  protected cleanErrorStack(error: Error): Error {
    if (error.stack) error.stack = this.filterStack(error.stack)
    return error
  }

  protected buildCallerStack(): string | undefined {
    const stack = new Error('Trace').stack
    if (!stack) return undefined
    const lines = stack.split('\n')
    let startIndex = 1
    for (let index = 1; index < lines.length; index++) {
      if (!lines[index].toLowerCase().includes('colorino')) {
        startIndex = index
        break
      }
    }
    return this.filterStack(lines.slice(startIndex).join('\n')) || undefined
  }
}
