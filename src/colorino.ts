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
  private _colorLevel: ColorLevel | 'UnknownEnv'

  constructor(
    private readonly _palette: Palette,
    private readonly _validator: InputValidator,
    private readonly _browserColorSupportDetector?: BrowserColorSupportDetector,
    private readonly _nodeColorSupportDetector?: NodeColorSupportDetector,
    private readonly _options: ColorinoOptions = {}
  ) {
    this._colorLevel = this._detectColorSupport()

    const validatePaletteResult = this._validator.validatePalette(this._palette)
    if (validatePaletteResult.isErr()) throw validatePaletteResult.error

    if (
      (this._colorLevel === ColorLevel.NO_COLOR ||
        this._colorLevel === 'UnknownEnv') &&
      !this._options.disableWarnings
    ) {
      this._maybeWarnUser()
    }
  }

  color(level: LogLevel, text: string): string {
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
      case ColorLevel.ANSI: {
        const code = colorConverter.hex.toAnsi16(hex)
        if (code < 38) {
          ansiCode = `\x1b[${code}m`
        } else {
          ansiCode = `\x1b[${code}m`
        }
        break
      }
      case 'UnknownEnv': {
        return text
      }
      default:
        return text
    }

    return `${ansiCode}${text}\x1b[0m`
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
    const isBrowserEnv = this._browserColorSupportDetector?.isBrowserEnv()
    if (isBrowserEnv) {
      this._colorLevel =
        this._browserColorSupportDetector?.getColorLevel() ?? 'UnknownEnv'
      return this._colorLevel
    }

    const isNodeEnv = this._nodeColorSupportDetector?.isNodeEnv()
    if (isNodeEnv) {
      this._colorLevel =
        this._nodeColorSupportDetector?.getColorLevel() ?? 'UnknownEnv'
      return this._colorLevel
    }

    return 'UnknownEnv'
  }

  private _maybeWarnUser(): void {
    if (this._alreadyWarned) return
    this._alreadyWarned = true
    console.warn(
      '[Colorino] No ANSI color support detected in this terminal. See https://github.com/chalk/supports-color#support-matrix to learn how to enable terminal color.'
    )
  }

  private _out(level: LogLevel, args: unknown[]): void {
    const processedArgs = args.map(arg =>
      typeof arg === 'string' ? this.color(level, arg) : arg
    )
    if (isConsoleMethod(level)) console[level](...processedArgs)
    else console.log(...processedArgs)
  }
}
