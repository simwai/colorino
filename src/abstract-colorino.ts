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
    const vP = this.validator.validatePalette(this.palette); if (vP.isErr()) throw vP.error
    const vO = this.validator.validateOptions(this.options); if (vO.isErr()) throw vO.error
    this.colorLevel = colorLevel
  }

  log(...args: unknown[]): void { this.logInternal('log', args) }
  info(...args: unknown[]): void { this.logInternal('info', args) }
  warn(...args: unknown[]): void { this.logInternal('warn', args) }
  error(...args: unknown[]): void { this.logInternal('error', args) }
  trace(...args: unknown[]): void { this.logInternal('trace', args) }
  debug(...args: unknown[]): void { this.logInternal('debug', args) }

  colorize(text: string, hex: string): string | BrowserColorizedArg {
    if (this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv') return text
    if (this.isBrowser()) return { [ColorinoBrowserColorized]: true, text, hex }
    const ansi = this.toAnsiPrefix(hex)
    return ansi ? `${ansi}${text}\x1b[0m` : text
  }

  protected logInternal(level: LogLevel, args: unknown[]): void {
    if (!this.isLevelEnabled(level)) return
    const caller = this.captureCaller(4)
    const tags = this.buildMetadataTags(level, caller)
    let method: ConsoleMethod = 'log'
    if (level === 'info') method = 'info'
    else if (level === 'warn') method = 'warn'
    else if (level === 'error') method = 'error'
    else if (level === 'debug') method = 'debug'
    const formatted = this.formatArgs(level === 'trace' ? 'trace' : method, args, tags)
    console[method](...formatted)
    if (!this.isBrowser() && this.options.fileLogging?.isEnabled) this.writeToFile(level, args, caller)
  }

  protected abstract writeToFile(level: LogLevel, args: unknown[], caller?: CallSiteInfo): void

  private isLevelEnabled(level: LogLevel): boolean {
    const { logLevel: cfg } = this.options; if (!cfg) return true
    const candidates = cfg.allow ?? (['trace', 'debug', 'log', 'info', 'warn', 'error'] as LogLevel[])
    if (!candidates.includes(level)) return false
    const min = cfg.min ?? 'trace'
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[min]) return false
    return !cfg.deny?.includes(level)
  }

  private captureCaller(depth: number): CallSiteInfo | undefined {
    const cfg = this.options.metadata?.callSite
    // Disabled by default to maintain compatibility
    if (!(cfg?.isEnabled ?? false)) return undefined
    const stack = new Error().stack; if (!stack) return undefined
    const lines = stack.split('\n'), line = lines[depth] || lines[lines.length - 1]
    return line ? this.parseStackLine(line) : undefined
  }

  protected parseStackLine(line: string): CallSiteInfo | undefined {
    const v8 = /at\s+(?:async\s+)?(?:new\s+)?(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?/
    const m = line.match(v8); if (!m) return undefined
    const name = m[1], path = m[2] || '', l = parseInt(m[3] || '0', 10), c = parseInt(m[4] || '0', 10)
    let info: CallSiteInfo = { filename: this.extractF(path), relativePath: this.extractR(path), line: l, column: c, functionName: name }
    if (this.options.metadata?.callSite?.resolve) {
      const r = this.options.metadata.callSite.resolve({ file: info.filename, line: info.line, column: info.column, functionName: info.functionName })
      info = { ...info, filename: r.file, line: r.line, column: r.column, functionName: r.functionName }
    }
    return info
  }

  private extractF(p: string): string {
    const s = p.replace(/^(?:https?|file):\/\//, '').split(/[/\\]/)
    const last = s[s.length - 1] || ''
    return last.split(/[?#]/)[0] || ''
  }

  private extractR(p: string): string {
    if (this.isBrowser()) return this.extractF(p)
    try {
      if (typeof process !== 'undefined' && process.cwd) {
        const cwd = process.cwd()
        if (p.startsWith(cwd)) return p.slice(cwd.length).replace(/^[/\\]/, '').replace(/\\/g, '/')
      }
    } catch {}
    return this.extractF(p)
  }

  private buildMetadataTags(level: LogLevel, caller?: CallSiteInfo): FormattedTag[] {
    const cfg = this.options.metadata?.callSite
    if ((cfg?.isEnabled ?? false) && caller) {
      const tag = this.formatCallSiteTag(caller, cfg || {})
      return tag ? [tag] : []
    }
    return []
  }

  private formatCallSiteTag(caller: CallSiteInfo, config: CallSiteConfig): FormattedTag | null {
    const isF = config.isCallerFileVisible ?? true, isFn = config.isCallerFunctionVisible ?? false, isL = config.isCallerLineVisible ?? true, isC = config.isCallerColumnVisible ?? true, isR = config.isCallerPathRelative ?? false
    const fP = isF ? (isR ? caller.relativePath : caller.filename) : ''
    const lP = isL ? (isC ? `${caller.line}:${caller.column}` : `${caller.line}`) : ''
    const loc = fP && lP ? `${fP}:${lP}` : (fP || lP)
    let text = ''
    if (isFn && caller.functionName) text = loc ? `[${caller.functionName}@${loc}]` : `[${caller.functionName}]`
    else if (loc) text = `[${loc}]`
    return text ? { text, position: config.position ?? 'postfix' } : null
  }

  protected partitionTags(tags: FormattedTag[]): { prefix: FormattedTag[]; postfix: FormattedTag[] } {
    const prefix: FormattedTag[] = [], postfix: FormattedTag[] = []
    for (const t of tags) { if (t.position === 'prefix') prefix.push(t); else postfix.push(t) }
    return { prefix, postfix }
  }

  protected abstract formatArgs(method: ConsoleMethod, args: unknown[], tags: FormattedTag[]): unknown[]
  protected abstract isBrowser(): boolean
  protected abstract gradient(text: string, start: string, end: string): string | BrowserCssArg
  protected toAnsiPrefix(_hex: string): string { return '' }

  protected formatValue(v: unknown, maxDepth = this.options.maxDepth ?? 5): string {
    const seen = new WeakSet<object>()
    const sanitize = (val: unknown, d: number): unknown => {
      if (TypeValidator.isNullOrUndefined(val) || !TypeValidator.isObject(val)) return val
      if (seen.has(val)) return '[Circular]'; seen.add(val)
      if (d >= maxDepth) return '[Object]'
      if (TypeValidator.isArray(val)) return val.map(i => sanitize(i, d + 1))
      const res: Record<string, unknown> = {}
      for (const k in val) res[k] = sanitize(val[k], d + 1)
      return res
    }
    return JSON.stringify(sanitize(v, 0), null, 2)
  }

  protected filterStack(input: string | Error | undefined): string {
    const nV = this.options.areNodeFramesVisible ?? true, cV = this.options.areColorinoFramesVisible ?? false
    const s = TypeValidator.isError(input) ? input.stack : (TypeValidator.isStackLikeString(input) ? input : '')
    if (!s) return ''
    const lines = s.split('\n'), h = lines[0] || '', isE = !h.trim().startsWith('at ')
    const filtered = lines.slice(isE ? 1 : 0).filter(l => {
      const low = l.toLowerCase()
      return !((!cV && low.includes('colorino')) || (!nV && low.includes('node:')))
    })
    return isE ? [h, ...filtered].join('\n') : filtered.join('\n')
  }

  protected cleanErrorStack(e: Error): Error { if (e.stack) e.stack = this.filterStack(e.stack); return e }
  protected buildCallerStack(): string | undefined {
    const s = new Error('Trace').stack
    return s ? this.filterStack(s.split('\n').slice(1).join('\n')) : undefined
  }
}
