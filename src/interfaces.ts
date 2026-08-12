import { ColorLevel } from './enums.js'
import {
  BrowserCssArg,
  ConsoleMethod,
  CssConsoleStyle,
  TerminalTheme,
  ThemeName,
} from './types.js'

export interface ColorinoFileLoggingOptions {
  path: string
  maxBytes?: number
  maxFiles?: number
  stripAnsi?: boolean
  timezone?: string
}

export interface ColorinoSanitizationOptions {
  enabled?: boolean
  keys?: string[]
  replacement?: string
}

export interface ColorinoOptions {
  theme?: TerminalTheme | ThemeName | 'auto'
  maxDepth?: number
  areNodeFramesVisible?: boolean // Default: true
  areColorinoFramesVisible?: boolean // Default: false
  isOsc11Enabled?: boolean // Default: true
  fileLogging?: ColorinoFileLoggingOptions
  sanitization?: ColorinoSanitizationOptions
}

export interface LogDecoratorOptions {
  logLevel?: ConsoleMethod
  logArguments?: boolean
  logReturnValue?: boolean
}

interface Colorino {
  log(...args: unknown[]): void
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
  debug(...args: unknown[]): void
  trace(...args: unknown[]): void
  colorize(text: string, hex: string): void
  gradient(text: string, startHex: string, endHex: string): void
}

export interface ColorinoBrowserInterface extends Colorino {
  css(text: string, style: CssConsoleStyle): string | BrowserCssArg
}

export interface ColorinoNodeInterface extends Colorino {}

export interface ColorSupportDetectorInterface {
  getColorLevel(): ColorLevel
}
