export type ConsoleMethod =
  | 'log'
  | 'info'
  | 'warn'
  | 'error'
  | 'trace'
  | 'debug'

/** Valid log levels for Colorino. */
export type LogLevel = 'trace' | 'debug' | 'log' | 'info' | 'warn' | 'error' | 'fatal'

/** Priority mapping for log levels (higher is more important). */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  log: 30,
  warn: 40,
  error: 50,
  fatal: 60,
} as const

/** Internal representation of a call-site frame. */
export interface CallSiteInfo {
  filename: string
  relativePath: string
  line: number
  column: number
  functionName?: string
}

/** Formatted tag ready for injection. */
export interface FormattedTag {
  text: string
  position: 'prefix' | 'postfix'
}

export type RgbColor = [number, number, number]
export type HslColor = [number, number, number]
export type RgbaColor = [number, number, number, number]

export type Palette = Record<ConsoleMethod, string>
export type TerminalTheme = 'dark' | 'light' | 'unknown'

export type ThemeName =
  | 'catppuccin-mocha'
  | 'catppuccin-latte'
  | 'dracula'
  | 'github-light'

export const ColorinoBrowserColorized = Symbol('colorino.browserColorized')
export const ColorinoBrowserObject = Symbol('colorino.browserObject')
export const ColorinoBrowserCss = Symbol('colorino.browserCss')

export type CssConsoleStyle = string | Record<string, string>

export interface BrowserCssArg {
  [ColorinoBrowserCss]: true
  text: string
  css: string
}

export type BrowserColorizedArg = {
  [ColorinoBrowserColorized]: true
  text: string
  hex: string
}

export type BrowserObjectArg = {
  [ColorinoBrowserObject]: true
  value: unknown
}
