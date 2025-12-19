import { colorConverter } from './color-converter.js'
import { NodeColorSupportDetector } from './node-color-support-detector.js'
import { ColorLevel } from './enums.js'
import {
  type Palette,
  type LogLevel,
  isConsoleMethod,
  type ColorinoOptions,
} from './types.js'
import { BrowserColorSupportDetector } from './browser-color-support-detector.js'
import { InputValidator } from './input-validator.js'

export class Colorino {
  private _alreadyWarned = false
  private readonly _colorLevel: ColorLevel | 'UnknownEnv'
  private readonly isBrowser: boolean

  constructor(
    private readonly _palette: Palette,
    private readonly _validator: InputValidator,
    private readonly _browserColorSupportDetector?: BrowserColorSupportDetector,
    private readonly _nodeColorSupportDetector?: NodeColorSupportDetector,
    private readonly _options: ColorinoOptions = {}
  ) {
    this.isBrowser = !!this._browserColorSupportDetector

    this._colorLevel = this._detectColorSupport()

    const validatePaletteResult = this._validator.validatePalette(this._palette)
    if (validatePaletteResult.isErr()) throw validatePaletteResult.error
    if (
      !this.isBrowser &&
      (this._colorLevel === ColorLevel.NO_COLOR ||
        this._colorLevel === 'UnknownEnv') &&
      !this._options.disableWarnings
    ) {
      this._maybeWarnUser()
    }
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

  private _detectColorSupport(): ColorLevel | 'UnknownEnv' {
    if (this.isBrowser) {
      return this._browserColorSupportDetector?.getColorLevel() ?? 'UnknownEnv'
    }
    if (this._nodeColorSupportDetector?.isNodeEnv()) {
      return this._nodeColorSupportDetector?.getColorLevel() ?? 'UnknownEnv'
    }
    return 'UnknownEnv'
  }

  private _maybeWarnUser(): void {
    if (this._alreadyWarned) return
    this._alreadyWarned = true
    console.warn(
      '[Colorino] No ANSI color support detected in this terminal. See [https://github.com/chalk/supports-color#support-matrix](https://github.com/chalk/supports-color#support-matrix) to learn how to enable terminal color.'
    )
  }

  private _formatValue(value: unknown, maxDepth = 3): string {
    const seen = new WeakSet<object>()

    const sanitize = (val: unknown, currentDepth: number): unknown => {
      if (val === null || typeof val !== 'object') return val

      if (seen.has(val)) return '[Circular]'
      seen.add(val)

      if (currentDepth >= maxDepth) return '[Object]'

      if (Array.isArray(val)) {
        return val.map(item => sanitize(item, currentDepth + 1))
      }

      const result: Record<string, unknown> = {}
      for (const key in val) {
        result[key] = sanitize((val as any)[key], currentDepth + 1)
      }
      return result
    }

    return JSON.stringify(sanitize(value, 0), null, 2)
  }

  private _out(level: LogLevel, args: unknown[]): void {
    const consoleMethod = isConsoleMethod(level) ? level : 'log'

    const processedArgs = args.map(arg => {
      if (
        arg !== null &&
        typeof arg === 'object' &&
        typeof arg !== 'string' &&
        !(arg instanceof Error)
      ) {
        return this._formatValue(arg)
      }
      return arg
    })

    if (
      this._colorLevel === ColorLevel.NO_COLOR ||
      this._colorLevel === 'UnknownEnv'
    ) {
      if (level === 'trace') console.trace(...processedArgs)
      else console[consoleMethod](...processedArgs)
      return
    }

    if (this.isBrowser) {
      const hex = this._palette[level]
      if (typeof processedArgs[0] === 'string') {
        console[consoleMethod](
          `%c${processedArgs[0]}`,
          `color:${hex}`,
          ...processedArgs.slice(1)
        )
      } else {
        console[consoleMethod](...processedArgs)
      }
      return
    }

    const hex = this._palette[level]
    let ansiCode: string

    switch (this._colorLevel) {
      case ColorLevel.TRUECOLOR: {
        const [r, g, b] = colorConverter.hex.toRgb(hex)
        ansiCode = `\x1b[38;2;${r};${g};${b}m`
        break
      }
      case ColorLevel.ANSI256: {
        const code = colorConverter.hex.toAnsi256(hex)
        ansiCode = `\x1b[38;5;${code}m`
        break
      }
      case ColorLevel.ANSI:
      default: {
        const code = colorConverter.hex.toAnsi16(hex)
        ansiCode = `\x1b[${code}m`
        break
      }
    }

    const coloredArgs = [...processedArgs]
    const firstStringIndex = coloredArgs.findIndex(
      arg => typeof arg === 'string'
    )
    if (firstStringIndex !== -1) {
      coloredArgs[firstStringIndex] =
        `${ansiCode}${coloredArgs[firstStringIndex]}\x1b[0m`
    }

    if (level === 'trace') {
      console.trace(...coloredArgs)
    } else {
      console[consoleMethod](...coloredArgs)
    }
  }
}
