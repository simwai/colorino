import { ColorLevel } from './enums.js'
import {
  ConsoleMethod,
  Palette,
  LogLevel,
  LOG_LEVEL_PRIORITY,
  CallSiteInfo,
  FormattedTag,
  ColorinoBrowserColorized,
} from './types.js'
import { ColorinoOptions } from './interfaces.js'
import { TypeValidator } from './type-validator.js'
import { InputValidator } from './input-validator.js'

export abstract class AbstractColorino {
  protected readonly palette: Palette

  constructor(
    initialPalette: Palette,
    userPalette: Partial<Palette>,
    protected readonly validator: InputValidator,
    protected readonly colorLevel: ColorLevel | 'UnknownEnv',
    protected readonly options: ColorinoOptions = {}
  ) {
    this.palette = { ...initialPalette, ...userPalette }

    const paletteRes = this.validator.validatePalette(this.palette)
    if (paletteRes.isErr()) throw paletteRes.error

    const optionsRes = this.validator.validateOptions(this.options)
    if (optionsRes.isErr()) throw optionsRes.error
  }

  public log(...args: unknown[]): void { this.logInternal('log', args) }
  public info(...args: unknown[]): void { this.logInternal('info', args) }
  public warn(...args: unknown[]): void { this.logInternal('warn', args) }
  public error(...args: unknown[]): void { this.logInternal('error', args) }
  public trace(...args: unknown[]): void { this.logInternal('trace', args) }
  public debug(...args: unknown[]): void { this.logInternal('debug', args) }
  public fatal(...args: unknown[]): void { this.logInternal('fatal', args) }

  public abstract gradient(text: string, startHex: string, endHex: string): string | { text: string; css: string; [key: symbol]: boolean }

  public colorize(text: string, hex: string): string | { text: string; hex: string; [key: symbol]: boolean } {
    if (this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv') {
      return text
    }

    if (this.isBrowser()) {
      return { [ColorinoBrowserColorized]: true, text, hex } as any
    }

    return `${this.toAnsiPrefix(hex)}${text}\x1b[0m`
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
    if (level === 'log' || level === 'info' || level === 'warn' || level === 'error' || level === 'trace' || level === 'debug') {
      return level as ConsoleMethod
    }
    return 'log'
  }

  protected abstract writeToFile(level: LogLevel, args: unknown[], caller?: CallSiteInfo): void

  private isLevelEnabled(level: LogLevel): boolean {
    const config = this.options.logLevel
    if (!config) return true

    const allowed = config.allow ?? (Object.keys(LOG_LEVEL_PRIORITY) as LogLevel[])
    if (!allowed.includes(level)) return false

    const min = config.min ?? 'trace'
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[min]) return false

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

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue
      const lower = line.toLowerCase()
      const isInternal = lower.includes('colorino') || lower.includes('loginternal') || lower.includes('capturecaller')
      if (!isInternal) {
        frameLine = line
        break
      }
    }

    return frameLine ? this.parseStackLine(frameLine) : undefined
  }

  protected parseStackLine(line: string): CallSiteInfo | undefined {
    const parts = line.trim().split(/\s+/)
    let locationStr = parts[parts.length - 1]
    if (locationStr.startsWith('(') && locationStr.endsWith(')')) {
      locationStr = locationStr.slice(1, -1)
    }

    const lastColon = locationStr.lastIndexOf(':')
    if (lastColon === -1) return undefined
    const column = parseInt(locationStr.slice(lastColon + 1), 10)

    const secondLastColon = locationStr.lastIndexOf(':', lastColon - 1)
    if (secondLastColon === -1) return undefined
    const lineNum = parseInt(locationStr.slice(secondLastColon + 1, lastColon), 10)

    const rawPath = locationStr.slice(0, secondLastColon)
    if (!rawPath) return undefined

    // Simple function name detection
    let functionName: string | undefined
    if (parts[1] !== locationStr && parts[1] !== 'at') {
      functionName = parts[1]
    }

    const info: CallSiteInfo = {
      filename: this.extractFilename(rawPath),
      relativePath: this.extractRelativePath(rawPath),
      line: lineNum,
      column: column,
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

  private extractFilename(path: string): string {
    const segments = path.replace(/^(?:https?|file):\/\//, '').split(/[/\\]/)
    const last = segments[segments.length - 1] || ''
    return last.split(/[?#]/)[0] || ''
  }

  private extractRelativePath(path: string): string {
    if (this.isBrowser()) return this.extractFilename(path)
    try {
      if (typeof process !== 'undefined' && process.cwd) {
        const cwd = process.cwd()
        const normalizedPath = path.replace(/^(?:file):\/\//, '')
        if (normalizedPath.startsWith(cwd)) {
          return normalizedPath.slice(cwd.length).replace(/^[/\\]/, '').replace(/\\/g, '/')
        }
      }
    } catch {}
    return this.extractFilename(path)
  }

  private buildMetadataTags(level: LogLevel, caller?: CallSiteInfo): FormattedTag[] {
    const config = this.options.metadata?.callSite
    if ((config?.isEnabled ?? false) && caller) {
      const tag = this.formatCallSiteTag(caller, config || {})
      return tag ? [tag] : []
    }
    return []
  }

  private formatCallSiteTag(caller: CallSiteInfo, config: ColorinoOptions['metadata']['callSite'] = {}): FormattedTag | null {
    const parts: string[] = []

    if (config.isCallerFunctionVisible && caller.functionName) parts.push(`${caller.functionName}@`)

    const file = config.isCallerPathRelative ? caller.relativePath : caller.filename
    if (config.isCallerFileVisible !== false) parts.push(file)

    if (config.isCallerLineVisible !== false) {
      parts.push(`:${caller.line}`)
      if (config.isCallerColumnVisible !== false) parts.push(`:${caller.column}`)
    }

    const text = parts.join('')
    return text ? { text: `[${text}]`, position: config.position ?? 'postfix' } : null
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
  protected abstract gradient(text: string, start: string, end: string): string | { text: string; css: string; [key: symbol]: boolean }
  protected toAnsiPrefix(_hex: string): string { return '' }

  protected formatValue(value: unknown, maxDepth = this.options.maxDepth ?? 5): string {
    const visited = new WeakSet<object>()
    const transform = (val: unknown, depth: number): unknown => {
      if (TypeValidator.isNullOrUndefined(val) || !TypeValidator.isObject(val)) {
        if (typeof val === 'bigint') return `${val.toString()}n`
        return val
      }
      if (visited.has(val)) return '[Circular]'
      visited.add(val)
      if (depth >= maxDepth) return '[Object]'

      if (TypeValidator.isArray(val)) {
        return val.map(item => transform(item, depth + 1))
      }
      const result: Record<string, unknown> = {}
      for (const key in val) {
        if (Object.prototype.hasOwnProperty.call(val, key)) {
          result[key] = transform(val[key], depth + 1)
        }
      }
      visited.delete(val) // Allow same object at different paths
      return result
    }
    return JSON.stringify(transform(value, 0), null, 2)
  }

  protected filterStack(input: string | Error | undefined): string {
    const showNode = this.options.areNodeFramesVisible ?? true
    const showInternal = this.options.areColorinoFramesVisible ?? false
    const stack = TypeValidator.isError(input) ? input.stack : (TypeValidator.isStackLikeString(input) ? input : '')
    if (!stack) return ''

    const lines = stack.split('\n')
    const header = lines[0] || ''
    const isErrorHeader = !header.trim().startsWith('at ')

    const frames = lines.slice(isErrorHeader ? 1 : 0).filter(line => {
      const lower = line.toLowerCase()
      return !((!showInternal && lower.includes('colorino')) || (!showNode && lower.includes('node:')))
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
    let start = 1
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].toLowerCase().includes('colorino')) {
        start = i
        break
      }
    }
    return this.filterStack(lines.slice(start).join('\n')) || undefined
  }
}
