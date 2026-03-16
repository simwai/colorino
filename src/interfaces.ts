import { ColorLevel } from './enums.js'
import {
  BrowserCssArg,
  CssConsoleStyle,
  TerminalTheme,
  ThemeName,
  LogLevel,
} from './types.js'

export interface MetadataTagBase {
  /**
   * Enable or disable this metadata tag.
   * @default platform-dependent
   */
  isEnabled?: boolean
  /**
   * Tag placement relative to the log message.
   * @default 'postfix'
   */
  position?: 'prefix' | 'postfix'
}

export interface CallSiteConfig extends MetadataTagBase {
  /**
   * Display the caller's filename.
   * @default true
   */
  isCallerFileVisible?: boolean
  /**
   * Display the caller's function name.
   * @default false
   */
  isCallerFunctionVisible?: boolean
  /**
   * Display the caller's line number.
   * @default true
   */
  isCallerLineVisible?: boolean
  /**
   * Display the caller's column number.
   * @default true
   */
  isCallerColumnVisible?: boolean
  /**
   * Show path relative to process.cwd() instead of just filename (Node only).
   * @default false
   */
  isCallerPathRelative?: boolean
  /**
   * Optional hook to transform raw file/line/column.
   */
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
  /**
   * Enable writing logs to a file (Node only).
   * @default false
   */
  isEnabled: boolean
  /**
   * Path to the log file.
   */
  path: string
  /**
   * Whether to append to an existing file.
   * @default true
   */
  isAppendMode?: boolean
  /**
   * Minimum level to write to this file.
   */
  minLevel?: LogLevel
}

export interface ColorinoOptions {
  theme?: TerminalTheme | ThemeName | 'auto'
  maxDepth?: number
  areNodeFramesVisible?: boolean // Default: true
  areColorinoFramesVisible?: boolean // Default: false
  isOsc11Enabled?: boolean // Default: true
  logLevel?: {
    /**
     * Minimum level to log to console.
     * @default 'trace'
     */
    min?: LogLevel
    /**
     * Explicit whitelist. If present, only these levels are considered.
     */
    allow?: LogLevel[]
    /**
     * Blacklist. Levels here are disabled even if they pass min/allow.
     */
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
  colorize(text: string, hex: string): any
  gradient(text: string, startHex: string, endHex: string): any
}

export interface ColorinoBrowserInterface extends Colorino {
  css(text: string, style: CssConsoleStyle): string | BrowserCssArg
}

export interface ColorinoNodeInterface extends Colorino {}

export interface ColorSupportDetectorInterface {
  getColorLevel(): ColorLevel
}
