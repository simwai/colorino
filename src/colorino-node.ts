import * as fs from 'node:fs'
import * as path from 'node:path'
import { AbstractColorino } from './abstract-colorino.js'
import { ColorLevel } from './enums.js'
import {
  ConsoleMethod,
  Palette,
  LogLevel,
  FormattedTag,
  CallSiteInfo,
  LOG_LEVEL_PRIORITY,
} from './types.js'
import { ColorinoNodeInterface, ColorinoOptions } from './interfaces.js'
import { TypeValidator } from './type-validator.js'
import { colorConverter } from './color-converter.js'
import { InputValidator } from './input-validator.js'

export class ColorinoNode extends AbstractColorino implements ColorinoNodeInterface {
  private logQueue: string[] = []
  private isWriting = false

  constructor(iP: Palette, uP: Partial<Palette>, v: InputValidator, cL: ColorLevel | 'UnknownEnv', o: ColorinoOptions = {}) {
    super(iP, uP, v, cL, o)
  }

  public gradient(text: string, sH: string, eH: string): string {
    if (this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv' || this.colorLevel === ColorLevel.ANSI) return text
    const chars = [...text], colors = colorConverter.hex.gradient(sH, eH, chars.length)
    return chars.map((c, i) => {
      const [r, g, b] = colors[i] || [0, 0, 0]
      if (this.colorLevel === ColorLevel.TRUECOLOR) return `\x1b[38;2;${r};${g};${b}m${c}`
      return `\x1b[38;5;${colorConverter.rgb.toAnsi256([r, g, b])}m${c}`
    }).join('') + '\x1b[0m'
  }

  protected writeToFile(level: LogLevel, args: unknown[], caller?: CallSiteInfo): void {
    const cfg = this.options.fileLogging; if (!cfg?.isEnabled) return
    const min = cfg.minLevel ?? this.options.logLevel?.min ?? 'trace'
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[min]) return
    const msg = args.map(a => TypeValidator.isError(a) ? `${a.name}: ${a.message}\n${a.stack}` : (TypeValidator.isObject(a) ? this.formatValue(a) : String(a))).join(' ')
    let line = `${new Date().toISOString()} [${level}] ${msg}`
    const meta = this.options.metadata?.callSite
    if ((meta?.isEnabled ?? false) && caller) {
      const f = meta?.isCallerFileVisible ?? true ? (meta?.isCallerPathRelative ? caller.relativePath : caller.filename) : ''
      const l = meta?.isCallerLineVisible ?? true ? (meta?.isCallerColumnVisible ?? true ? `${caller.line}:${caller.column}` : `${caller.line}`) : ''
      const loc = f && l ? `${f}:${l}` : (f || l)
      if (loc) line += ` [${loc}]`
    }
    this.logQueue.push(line + '\n'); this.processQueue()
  }

  private async processQueue() {
    if (this.isWriting || !this.logQueue.length) return
    this.isWriting = true
    const cfg = this.options.fileLogging!, logP = path.resolve(process.cwd(), cfg.path)
    try {
      const dir = path.dirname(logP); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      while (this.logQueue.length) {
        const line = this.logQueue.shift()!, flag = cfg.isAppendMode === false ? 'w' : 'a'
        await fs.promises.appendFile(logP, line, { flag })
        if (cfg.isAppendMode === false) cfg.isAppendMode = true
      }
    } catch (e) { console.error('File write failed:', e) }
    finally { this.isWriting = false }
  }

  protected formatArgs(method: ConsoleMethod, args: unknown[], tags: FormattedTag[] = []): unknown[] {
    const hasE = args.some(a => TypeValidator.isError(a) || TypeValidator.isStackLikeString(a))
    const toP = method === 'trace' && !hasE ? [...args, this.buildCallerStack()] : args
    const hex = this.palette[method === 'trace' ? 'trace' : method] || '#ffffff', ansi = this.toAnsiPrefix(hex)
    const { prefix, postfix } = this.partitionTags(tags), res: unknown[] = []
    for (const t of prefix) res.push(ansi ? `${ansi}${t.text}\x1b[0m` : t.text)
    let pO = false
    for (const a of toP) {
      if (TypeValidator.isFormattableObject(a)) { const s = this.formatValue(a); res.push(`\n${s}`); pO = true }
      else if (TypeValidator.isError(a)) {
        const c = this.cleanErrorStack(a); if (!c.name.trim() || !c.message.trim() || !c.stack?.trim()) continue
        const h = `${c.name}: ${c.message}`, s = c.stack.split('\n').slice(1).join('\n')
        const f = s ? `${ansi ? `${ansi}${h}\x1b[0m` : h}\n${s}` : (ansi ? `${ansi}${h}\x1b[0m` : h)
        res.push(pO ? f : `\n${f}`); pO = true
      } else if (TypeValidator.isStackLikeString(a)) {
        const f = this.filterStack(a); if (!f.trim()) continue
        const lines = f.split('\n'), isE = lines[0]?.includes('Error') && lines[0]?.includes(':')
        if (isE) { const c = ansi ? `${ansi}${lines[0]}\x1b[0m` : lines[0], s = lines.slice(1).join('\n'); res.push(`\n${s ? `${c}\n${s}` : c}`) }
        else res.push(`\n${f}`); pO = true
      } else if (TypeValidator.isString(a)) {
        const s = pO ? `\n${a}` : a; res.push(ansi && !TypeValidator.isAnsiColoredString(a) && !TypeValidator.isStackLikeString(a) ? `${ansi}${s}\x1b[0m` : s); pO = false
      } else { res.push(a); pO = false }
    }
    for (const t of postfix) res.push(ansi ? `${ansi}${t.text}\x1b[0m` : t.text)
    return res
  }

  protected isBrowser(): boolean { return false }
  protected override toAnsiPrefix(h: string): string {
    if (this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv') return ''
    if (this.colorLevel === ColorLevel.TRUECOLOR) { const [r, g, b] = colorConverter.hex.toRgb(h); return `\x1b[38;2;${r};${g};${b}m` }
    if (this.colorLevel === ColorLevel.ANSI256) return `\x1b[38;5;${colorConverter.hex.toAnsi256(h)}m`
    return `\x1b[${colorConverter.hex.toAnsi16(h)}m`
  }
}
