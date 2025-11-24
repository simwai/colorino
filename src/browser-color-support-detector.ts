import type { ColorSupportDetectorInterface } from './color-support-detector-interface.js'
import { ColorLevel } from './enums.js'
import type { TerminalTheme } from './types.js'

export class BrowserColorSupportDetector
  implements ColorSupportDetectorInterface
{
  constructor(
    private readonly _window:
      | {
          document: HTMLDocument
          matchMedia(arg0: string): { matches: unknown }
        }
      | undefined,
    private readonly _navigator: { userAgent: string } | undefined,
    private readonly _overrideTheme?: TerminalTheme
  ) {}

  isBrowserEnv(): boolean {
    return !!this._window && !!this._navigator?.userAgent
  }

  getColorLevel(): ColorLevel {
    if (!this.isBrowserEnv()) {
      return ColorLevel.NO_COLOR
    }

    const userAgent = this._navigator!.userAgent.toLowerCase()

    if (userAgent.includes('chrome')) return ColorLevel.ANSI256
    if (userAgent.includes('firefox')) return ColorLevel.ANSI256

    return ColorLevel.ANSI256
  }

  getTheme(): TerminalTheme {
    if (this._overrideTheme) {
      return this._overrideTheme
    }

    if (
      !this.isBrowserEnv() ||
      typeof this._window!.matchMedia !== 'function'
    ) {
      return 'unknown'
    }

    if (this._window!.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }

    if (this._window!.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light'
    }

    return 'unknown'
  }
}
