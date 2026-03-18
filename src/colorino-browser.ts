import { AbstractColorino } from './abstract-colorino.js'
import { ColorLevel } from './enums.js'
import {
  ConsoleMethod,
  Palette,
  BrowserCssArg,
  CssConsoleStyle,
  ColorinoBrowserCss,
  LogLevel,
  FormattedTag,
  CallSiteInfo,
} from './types.js'
import { ColorinoBrowserInterface, ColorinoOptions } from './interfaces.js'
import { TypeValidator } from './type-validator.js'
import { InputValidator } from './input-validator.js'

export class ColorinoBrowser extends AbstractColorino implements ColorinoBrowserInterface {
  constructor(iP: Palette, uP: Partial<Palette>, v: InputValidator, cL: ColorLevel | 'UnknownEnv', o: ColorinoOptions = {}) {
    super(iP, uP, v, cL, o)
  }
  public gradient(text: string, s: string, e: string): string | BrowserCssArg {
    if (this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv') return text
    const css = `background: linear-gradient(to right, ${s}, ${e}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`
    return { [ColorinoBrowserCss]: true, text, css }
  }
  public css(text: string, style: CssConsoleStyle): string | BrowserCssArg {
    if (this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv') return text
    return { [ColorinoBrowserCss]: true, text, css: this.normalizeCssStyle(style) }
  }
  protected writeToFile(): void {}
  protected formatArgs(method: ConsoleMethod, args: unknown[], tags: FormattedTag[] = []): unknown[] {
    const hasE = args.some(a => TypeValidator.isError(a) || TypeValidator.isStackLikeString(a))
    const toP = method === 'trace' && !hasE ? (() => { const s = this.buildCallerStack(); return s ? [...args, s] : args })() : args
    const hex = this.palette[method === 'trace' ? 'trace' : method] || '#ffffff', parts: string[] = [], fArgs: unknown[] = []
    const { prefix, postfix } = this.partitionTags(tags)
    for (const t of prefix) { parts.push('%c%s'); fArgs.push(`color:${hex}`, t.text) }
    let pO = false
    for (const a of toP) {
      if (TypeValidator.isBrowserColorizedArg(a)) { parts.push(`%c${a.text}`); fArgs.push(`color:${a.hex}`); pO = false }
      else if (TypeValidator.isBrowserCssArg(a)) { parts.push(`%c${a.text}`); fArgs.push(a.css); pO = false }
      else if (TypeValidator.isFormattableObject(a)) { parts.push(pO ? '%o' : '\n%o'); fArgs.push(a); pO = true }
      else if (TypeValidator.isError(a)) {
        const c = this.cleanErrorStack(a); if (!c.name.trim() || !c.message.trim() || !c.stack?.trim()) continue
        const head = `${c.name}: ${c.message}`, s = c.stack.split('\n').slice(1).join('\n')
        parts.push(pO ? '%c%s' : '\n%c%s'); fArgs.push(`color:${hex}`, head)
        if (s) { parts.push('\n%s'); fArgs.push(s) }
        pO = true
      } else if (TypeValidator.isStackLikeString(a)) {
        const f = this.filterStack(a); if (!f.trim()) continue
        parts.push('\n%s'); fArgs.push(f); pO = true
      } else if (TypeValidator.isString(a)) {
        parts.push(`%c${pO ? `\n${a}` : a}`); fArgs.push(`color:${hex}`); pO = false
      } else { parts.push('%o'); fArgs.push(a); pO = false }
    }
    for (const t of postfix) { parts.push('%c %s'); fArgs.push(`color:${hex}`, t.text) }
    return parts.length ? [parts.join(' '), ...fArgs] : toP
  }
  protected isBrowser(): boolean { return true }
  protected normalizeCssStyle(s: CssConsoleStyle): string {
    if (TypeValidator.isString(s)) return s
    const p = []; for (const n in s) if (Object.prototype.hasOwnProperty.call(s, n) && s[n]) p.push(`${n}:${s[n]}`)
    return p.join(';')
  }
}
