import { ColorLevel } from './enums.js'
import {
  BrowserCssArg,
  CssConsoleStyle,
  TerminalTheme,
  ThemeName,
  LogLevel,
  BrowserColorizedArg,
} from './types.js'

/**
 * Base configuration for metadata tags.
 */
export interface MetadataTagBase {
  /** Enable or disable this tag. */
  isEnabled?: boolean
  /** Placement relative to the log message. @default 'postfix' */
  position?: 'prefix' | 'postfix'
}

/**
 * Configuration for call-site information.
 */
export interface CallSiteConfig extends MetadataTagBase {
  /** Show the caller's filename. @default true */
  isCallerFileVisible?: boolean
  /** Show the caller's function name. @default false */
  isCallerFunctionVisible?: boolean
  /** Show the caller's line number. @default true */
  isCallerLineVisible?: boolean
  /** Show the caller's column number. @default true */
  isCallerColumnVisible?: boolean
  /** Show path relative to process.cwd() (Node only). @default false */
  isCallerPathRelative?: boolean
  /** Optional hook to transform captured frame data. */
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

/**
 * Reserved for future use.
 */
export interface TimestampConfig extends MetadataTagBase {
  format?: 'iso' | 'locale' | 'relative' | 'unix' | ((date: Date) => string)
  timezone?: string
}

/**
 * Configuration for Node.js file logging.
 */
export interface FileLoggingConfig {
  /** Enable writing logs to a file. */
  isEnabled: boolean
  /** Path to the log file. */
  path: string
  /** Whether to append to or overwrite the file on first write. @default true */
  isAppendMode?: boolean
  /** Minimum level to write to file. Falls back to global logLevel.min. */
  minLevel?: LogLevel
}

/**
 * Global configuration options for a Colorino instance.
 */
export interface ColorinoOptions {
  /** Force a theme or 'auto' for detection. */
  theme?: TerminalTheme | ThemeName | 'auto'
  /** Max depth for recursive object stringification. @default 5 */
  maxDepth?: number
  /** Show Node.js internal frames in stack traces. @default true */
  areNodeFramesVisible?: boolean
  /** Show Colorino internal frames in stack traces. @default false */
  areColorinoFramesVisible?: boolean
  /** Enable OSC 11 theme detection (Node only). @default true */
  isOsc11Enabled?: boolean
  /** Configure log level filtering (min level, allow-list, deny-list). */
  logLevel?: {
    min?: LogLevel
    allow?: LogLevel[]
    deny?: LogLevel[]
  }
  /** Attach metadata tags like call-site info to every log call. */
  metadata?: {
    callSite?: CallSiteConfig
    timestamp?: TimestampConfig
  }
  /** Write logs to a local file (Node only). */
  fileLogging?: FileLoggingConfig
}

/**
 * Public API for the Colorino logger.
 */
interface Colorino {
  /** Log a message at 'log' level. */
  log(...args: unknown[]): void
  /** Log operational information. */
  info(...args: unknown[]): void
  /** Log warnings that don't stop the application. */
  warn(...args: unknown[]): void
  /** Log serious errors that require attention. */
  error(...args: unknown[]): void
  /** Log critical errors that cause the application to fail. */
  fatal(...args: unknown[]): void
  /** Log detailed information for developers. */
  debug(...args: unknown[]): void
  /** Log extremely detailed trace information. */
  trace(...args: unknown[]): void
  /**
   * Manually colorize text with a hex color.
   * Returns a styled string (Node) or a CSS argument object (Browser).
   */
  colorize(text: string, hex: string): string | BrowserColorizedArg
  /**
   * Create a color gradient across text.
   * Returns a styled string (Node) or a CSS argument object (Browser).
   */
  gradient(
    text: string,
    startHex: string,
    endHex: string
  ): string | BrowserCssArg
}

/**
 * Browser-specific Colorino interface.
 */
export interface ColorinoBrowserInterface extends Colorino {
  /** Apply custom CSS styles to console output (Browser only). */
  css(text: string, style: CssConsoleStyle): string | BrowserCssArg
}

/**
 * Node.js-specific Colorino interface.
 */
export interface ColorinoNodeInterface extends Colorino {}

export interface ColorSupportDetectorInterface {
  getColorLevel(): ColorLevel
}
