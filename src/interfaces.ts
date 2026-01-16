import { ColorLevel } from './enums.js'
import {
  BrowserCssArg,
  CssConsoleStyle,
  TerminalTheme,
  ThemeName,
} from './types.js'

export interface ColorinoOptions {
  theme?: TerminalTheme | ThemeName | 'auto'
  maxDepth?: number
  areNodeFramesVisible?: boolean // Default: true
  areColorinoFramesVisible?: boolean // Default: false
  isOsc11Enabled?: boolean // Default: true
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
