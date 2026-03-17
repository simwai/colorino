import { ColorLevel } from './enums.js'
import {
  BrowserCssArg,
  CssConsoleStyle,
  TerminalTheme,
  ThemeName,
  LogLevel,
  BrowserColorizedArg,
} from './types.js'

export interface MetadataTagBase {
  isEnabled?: boolean
  position?: 'prefix' | 'postfix'
}

export interface CallSiteConfig extends MetadataTagBase {
  isCallerFileVisible?: boolean
  isCallerFunctionVisible?: boolean
  isCallerLineVisible?: boolean
  isCallerColumnVisible?: boolean
  isCallerPathRelative?: boolean
  resolve?(frame: {
    file: string
    line: number
    column: number
    functionName?: string
  }): {
    file: string
    line: number
    column: number
    functionName?: string
  }
}

export interface TimestampConfig extends MetadataTagBase {
  format?: 'iso' | 'locale' | 'relative' | 'unix' | ((date: Date) => string)
  timezone?: string
}

export interface FileLoggingConfig {
  isEnabled: boolean
  path: string
  isAppendMode?: boolean
  minLevel?: LogLevel
}

export interface ColorinoOptions {
  theme?: TerminalTheme | ThemeName | 'auto'
  maxDepth?: number
  areNodeFramesVisible?: boolean
  areColorinoFramesVisible?: boolean
  isOsc11Enabled?: boolean
  logLevel?: {
    min?: LogLevel
    allow?: LogLevel[]
    deny?: LogLevel[]
  }
  metadata?: {
    callSite?: CallSiteConfig
    timestamp?: TimestampConfig
  }
  fileLogging?: FileLoggingConfig
}

interface Colorino {
  log(...args: unknown[]): void
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
  debug(...args: unknown[]): void
  trace(...args: unknown[]): void
  colorize(text: string, hex: string): string | BrowserColorizedArg
  gradient(text: string, startHex: string, endHex: string): string | BrowserCssArg
}

export interface ColorinoBrowserInterface extends Colorino {
  css(text: string, style: CssConsoleStyle): string | BrowserCssArg
}

export interface ColorinoNodeInterface extends Colorino {}

export interface ColorSupportDetectorInterface {
  getColorLevel(): ColorLevel
}
