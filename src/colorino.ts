import { colorConverter } from './color-converter.js'
import { NodeColorSupportDetector } from './node-color-support-detector.js'
import { BrowserColorSupportDetector } from './browser-color-support-detector.js'
import { ColorLevel } from './enums.js'
import {
  type Palette,
  type LogLevel,
  isConsoleMethod,
  type ColorinoOptions,
  Colorino,
  ThemeName,
  ConsoleMethod,
  ColorinoBrowserColorized,
  ColorinoBrowserObject,
  BrowserColorizedArg,
} from './types.js'
import { InputValidator } from './input-validator.js'
import { themePalettes } from './theme.js'
import { determineBaseTheme } from './determine-base-theme.js'
import { TypeValidator } from './type-validator.js'

export class MyColorino implements Colorino {
  private _alreadyWarned = false
  private readonly _colorLevel: ColorLevel | 'UnknownEnv'
  private readonly isBrowser: boolean

  private _palette: Palette

  constructor(
    initialPalette: Palette,
    private readonly _userPalette: Partial<Palette>,
    private readonly _validator: InputValidator,
    private readonly _browserColorSupportDetector?: BrowserColorSupportDetector,
    private readonly _nodeColorSupportDetector?: NodeColorSupportDetector,
    private readonly _options: ColorinoOptions = {}
  ) {
    this._palette = initialPalette
    this.isBrowser = !!this._browserColorSupportDetector

    this._colorLevel = this._detectColorSupport()

    const validatePaletteResult = this._validator.validatePalette(this._palette)
    if (validatePaletteResult.isErr()) throw validatePaletteResult.error

    if (
      this._colorLevel !== ColorLevel.NO_COLOR &&
      !this._options.disableWarnings &&
      this._colorLevel === 'UnknownEnv'
    ) {
      this._maybeWarnUser()
    }

    const themeOpt = this._options.theme ?? 'auto'

    if (themeOpt === 'auto' && this._nodeColorSupportDetector) {
      this._nodeColorSupportDetector.onTheme(resolvedTheme => {
        this._applyResolvedTheme(resolvedTheme)
      })
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

  colorize(text: string, hex: string): string | BrowserColorizedArg {
    if (
      this._colorLevel === ColorLevel.NO_COLOR ||
      this._colorLevel === 'UnknownEnv'
    ) {
      return text
    }

    if (this.isBrowser) {
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

  private _isAnsiColoredString(value: unknown): value is string {
    // oxlint-disable-next-line no-control-regex
    return typeof value === 'string' && /\x1b\[[0-9;]*m/.test(value)
  }

  private _applyResolvedTheme(resolvedTheme: string) {
    const themeOpt = this._options.theme ?? 'auto'
    const baseThemeName: ThemeName = determineBaseTheme(themeOpt, resolvedTheme)
    const basePalette = themePalettes[baseThemeName]
    this._palette = { ...basePalette, ...this._userPalette }
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
      'No ANSI color support detected in this terminal. See [https://github.com/chalk/supports-color#support-matrix](https://github.com/chalk/supports-color#support-matrix) to learn how to enable terminal color.'
    )
  }

  private _formatValue(
    value: unknown,
    maxDepth = this._options.maxDepth ?? 5
  ): string {
    const seen = new WeakSet<object>()

    const sanitize = (val: unknown, currentDepth: number): unknown => {
      if (val == null || typeof val !== 'object') return val

      if (seen.has(val)) return '[Circular]'
      seen.add(val)

      if (currentDepth >= maxDepth) return '[Object]'

      if (Array.isArray(val)) {
        return val.map(item => sanitize(item, currentDepth + 1))
      }

      const result: Record<string, unknown> = {}
      for (const key in val) {
        result[key] = sanitize(
          (val as Record<string, unknown>)[key],
          currentDepth + 1
        )
      }
      return result
    }

    return JSON.stringify(sanitize(value, 0), null, 2)
  }

  private _normalizeString(value: unknown) {
    if (value instanceof String) return value.valueOf()
    return value
  }

  private _processArgs(args: unknown[]): unknown[] {
    const processedArgs: unknown[] = []
    let previousWasObject = false

    for (const rawArg of args) {
      const arg = this._normalizeString(rawArg)

      if (TypeValidator.isBrowserColorizedArg(arg)) {
        processedArgs.push(arg)
        previousWasObject = false
        continue
      }

      if (TypeValidator.isFormattableObject(arg)) {
        if (this.isBrowser) {
          processedArgs.push({
            [ColorinoBrowserObject]: true,
            value: arg,
          })
        } else {
          processedArgs.push(`\n${this._formatValue(arg)}`)
        }

        previousWasObject = true
      } else if (TypeValidator.isError(arg)) {
        processedArgs.push('\n', this._cleanErrorStack(arg))

        previousWasObject = true
      } else {
        if (TypeValidator.isString(arg) && previousWasObject) {
          processedArgs.push(`\n${arg}`)
        } else {
          processedArgs.push(arg)
        }

        previousWasObject = false
      }
    }

    return processedArgs
  }

  private _applyBrowserColors(
    consoleMethod: ConsoleMethod,
    args: unknown[]
  ): unknown[] {
    const formatParts: string[] = []
    const cssArgs: string[] = []
    const otherArgs: unknown[] = []

    const paletteHex = this._palette[consoleMethod]

    for (const rawArg of args) {
      const arg = this._normalizeString(rawArg)

      if (TypeValidator.isBrowserColorizedArg(arg)) {
        // Manual override via colorize()
        formatParts.push(`%c${arg.text}`)
        cssArgs.push(`color:${arg.hex}`)
        continue
      }

      if (TypeValidator.isBrowserObjectArg(arg)) {
        // Pretty-printed object wrapper from _processArgs
        formatParts.push('%o')
        otherArgs.push(arg.value)
        continue
      }

      if (TypeValidator.isString(arg)) {
        // Plain string uses palette color
        formatParts.push(`%c${arg}`)
        cssArgs.push(`color:${paletteHex}`)
        continue
      }

      // Fallback: non-string, non-wrapper → log as object
      formatParts.push('%o')
      otherArgs.push(arg)
    }

    // No strings at all → nothing to style, keep original args
    if (formatParts.length === 0) {
      return args
    }

    return [formatParts.join(''), ...cssArgs, ...otherArgs]
  }

  private _toAnsiPrefix(hex: string): string {
    if (
      this._colorLevel === ColorLevel.NO_COLOR ||
      this._colorLevel === 'UnknownEnv'
    ) {
      return ''
    }

    switch (this._colorLevel) {
      case ColorLevel.TRUECOLOR: {
        const [r, g, b] = colorConverter.hex.toRgb(hex)
        return `\x1b[38;2;${r};${g};${b}m`
      }
      case ColorLevel.ANSI256: {
        const code = colorConverter.hex.toAnsi256(hex)
        return `\x1b[38;5;${code}m`
      }
      case ColorLevel.ANSI:
      default: {
        const code = colorConverter.hex.toAnsi16(hex)
        return `\x1b[${code}m`
      }
    }
  }

  private _applyNodeColors(
    consoleMethod: ConsoleMethod,
    args: unknown[]
  ): unknown[] {
    const coloredArgs = [...args]
    const firstStringIndex = coloredArgs.findIndex(
      arg => typeof arg === 'string'
    )

    if (firstStringIndex === -1) {
      return coloredArgs
    }

    const first = coloredArgs[firstStringIndex]

    if (this._isAnsiColoredString(first)) {
      return coloredArgs
    }

    const hex = this._palette[consoleMethod]
    const ansiPrefix = this._toAnsiPrefix(hex)

    if (!ansiPrefix) {
      return coloredArgs
    }

    coloredArgs[firstStringIndex] = `${ansiPrefix}${String(first)}\x1b[0m`

    return coloredArgs
  }

  private _output(consoleMethod: ConsoleMethod, args: unknown[]): void {
    if (consoleMethod === 'trace') this._printCleanTrace(args)
    else console[consoleMethod](...args)
  }

  private _out(level: LogLevel, args: unknown[]): void {
    const consoleMethod = isConsoleMethod(level) ? level : 'log'
    const processedArgs = this._processArgs(args)

    if (
      this._colorLevel === ColorLevel.NO_COLOR ||
      this._colorLevel === 'UnknownEnv'
    ) {
      this._output(consoleMethod, processedArgs)
      return
    }

    if (this.isBrowser) {
      const coloredArgs = this._applyBrowserColors(consoleMethod, processedArgs)
      this._output(consoleMethod, coloredArgs)
      return
    }

    const coloredArgs = this._applyNodeColors(consoleMethod, processedArgs)
    this._output(consoleMethod, coloredArgs)
  }

  private _filterStack(stack: string): string {
    return stack
      .split('\n')
      .filter(line => !line.match(/.*colorino.*/gi))
      .join('\n')
  }

  private _cleanErrorStack(error: Error): Error {
    if (!error.stack) return error

    const cleanStack = this._filterStack(error.stack)

    const cloned = Object.create(Object.getPrototypeOf(error)) as Error
    Object.assign(cloned, error)
    cloned.stack = cleanStack

    return cloned
  }

  private _printCleanTrace(args: unknown[]): void {
    const error = new Error()

    if (error.stack) {
      const cleanStack = this._filterStack(error.stack)
      console.log(...args, `\n${cleanStack}`)
    } else {
      console.log(...args)
    }
  }
}