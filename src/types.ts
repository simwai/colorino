export type ConsoleMethod =
  | 'log'
  | 'info'
  | 'warn'
  | 'error'
  | 'trace'
  | 'debug'
export type LogLevel = ConsoleMethod & string

export function isConsoleMethod(level: string): level is ConsoleMethod {
  return ['log', 'info', 'warn', 'error', 'trace', 'debug'].includes(level)
}

export type RgbColor = [number, number, number]
export type HslColor = [number, number, number]
export type RgbaColor = [number, number, number, number]

export type Palette = Record<LogLevel, string>
export type TerminalTheme = 'dark' | 'light' | 'unknown'

export type ThemeName =
  | 'catppuccin-mocha'
  | 'catppuccin-latte'
  | 'dracula'
  | 'github-light'

export interface ColorinoOptions {
  disableWarnings?: boolean
  theme?: TerminalTheme | ThemeName | 'auto'
  disableOscProbe?: boolean
  maxDepth?: number
}

export interface Colorino {
  log(...args: unknown[]): void
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
  debug(...args: unknown[]): void
  trace(...args: unknown[]): void
  colorize(text: string, hex: string): void
}

export const ColorinoBrowserColorized = Symbol('colorino.browserColorized')
export const ColorinoBrowserObject = Symbol('colorino.browserObject')

export type BrowserColorizedArg = {
  [ColorinoBrowserColorized]: true
  text: string
  hex: string
}

export type BrowserObjectArg = {
  [ColorinoBrowserObject]: true
  value: unknown
}