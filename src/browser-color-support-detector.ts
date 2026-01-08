import type { ColorSupportDetectorInterface } from './interfaces.js'
import { ColorLevel } from './enums.js'
import type { TerminalTheme } from './types.js'

export class BrowserColorSupportDetector implements ColorSupportDetectorInterface {
  constructor(
    private readonly _window?: {
      document: HTMLDocument
      matchMedia(arg0: string): { matches: unknown }
    },
    private readonly _navigator?: { userAgent: string },
    private readonly _overrideTheme?: TerminalTheme
  ) {}

  isBrowserEnv(): boolean {
    return !!this._window && !!this._navigator?.userAgent
  }

  getColorLevel(): ColorLevel {
    return ColorLevel.TRUECOLOR
  }

  getTheme(): TerminalTheme {
    if (this._overrideTheme) {
      return this._overrideTheme
    }

    if (typeof this._window!.matchMedia !== 'function') {
      return 'unknown'
    }

    const isDarkTheme = this._window!.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches
    if (isDarkTheme) return 'dark'

    const isLightTheme = '(prefers-color-scheme: light)'
    if (this._window!.matchMedia(isLightTheme).matches) {
      return 'light'
    }

    return 'unknown'
  }
}
