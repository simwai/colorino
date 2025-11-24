import type {
  SpawnSyncOptionsWithStringEncoding,
  SpawnSyncReturns,
} from 'node:child_process'

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
}

export interface PathUtils {
  join(...paths: string[]): string
  dirname(path: string): string
}

export type SpawnSyncFn = (
  command: string,
  args: readonly string[],
  options: SpawnSyncOptionsWithStringEncoding
) => SpawnSyncReturns<string>

export interface ProcessSpawner {
  spawnSync(
    command: string,
    args: string[],
    options: { stdio: any[]; timeout: number; encoding: string }
  ): SpawnSyncReturns<string>

  getExecPath(): string

  resolveScriptPath(scriptName: string): string
}
