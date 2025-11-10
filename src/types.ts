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

export interface ColorinoOptions {
  disableWarnings?: boolean
  theme?: TerminalTheme
}
