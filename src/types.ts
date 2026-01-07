export type ConsoleMethod =
  | 'log'
  | 'info'
  | 'warn'
  | 'error'
  | 'trace'
  | 'debug'
export type LogLevel = ConsoleMethod & string

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
