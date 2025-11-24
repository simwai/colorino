import { fileURLToPath } from 'node:url'
import type { ColorSupportDetectorInterface } from './color-support-detector-interface.js'
import { ColorLevel } from './enums.js'
import type { TerminalTheme } from './types.js'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { Result } from 'neverthrow'

export class NodeColorSupportDetector implements ColorSupportDetectorInterface {
  private readonly _envForceColor?: string
  private readonly _envTerm?: string
  private readonly _envColorTerm?: string
  private readonly _envNoColor?: string
  private readonly _envCliColor?: string
  private readonly _envCliColorForce?: string
  private readonly _envWtSession?: string
  private readonly _isTTY?: boolean
  private readonly _overrideTheme?: TerminalTheme

  constructor(
    private readonly _process?: NodeJS.Process,
    overrideTheme?: TerminalTheme
  ) {
    if (!this.isNodeEnv()) return

    const processEnv = _process!.env
    this._envForceColor = processEnv['FORCE_COLOR']
    this._envNoColor = processEnv['NO_COLOR']
    this._envTerm = processEnv['TERM']
    this._envColorTerm = processEnv['COLORTERM']
    this._envCliColor = processEnv['CLICOLOR']
    this._envCliColorForce = processEnv['CLICOLOR_FORCE']
    this._envWtSession = processEnv['WT_SESSION']

    this._isTTY = !!_process!.stdout.isTTY
    this._overrideTheme = overrideTheme
  }

  isNodeEnv(): boolean {
    return typeof this._process !== 'undefined'
  }

  getColorLevel(): ColorLevel {
    if (this._envNoColor !== undefined) {
      return ColorLevel.NO_COLOR
    }

    if (this._envForceColor !== undefined) {
      if (this._envForceColor === '0' || this._envForceColor === 'false') {
        return ColorLevel.NO_COLOR
      }
      if (this._envForceColor === '1' || this._envForceColor === 'true') {
        return ColorLevel.ANSI
      }
      const level = parseInt(this._envForceColor, 10)
      if (level >= 0 && level <= 3) {
        return level as ColorLevel
      }
      return ColorLevel.ANSI
    }

    const isForced =
      this._envCliColorForce !== undefined && this._envCliColorForce !== '0'

    if (!this._isTTY && !isForced) {
      return ColorLevel.NO_COLOR
    }

    if (this._envTerm === 'dumb') {
      return ColorLevel.NO_COLOR
    }

    if (this._envColorTerm === 'truecolor' || this._envColorTerm === '24bit') {
      return ColorLevel.TRUECOLOR
    }

    if (this._envWtSession !== undefined) {
      return ColorLevel.TRUECOLOR
    }

    if (this._envTerm) {
      if (
        /^xterm-kitty$/.test(this._envTerm) ||
        /^xterm-ghostty$/.test(this._envTerm) ||
        /^wezterm$/.test(this._envTerm) ||
        this._envTerm.endsWith('-truecolor')
      ) {
        return ColorLevel.TRUECOLOR
      }

      if (/-256(color)?$/i.test(this._envTerm)) {
        return ColorLevel.ANSI256
      }

      if (
        /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(
          this._envTerm
        )
      ) {
        return ColorLevel.ANSI
      }
    }

    if (this._envColorTerm) {
      return ColorLevel.ANSI
    }

    if (this._envCliColor !== undefined && this._envCliColor !== '0') {
      return ColorLevel.ANSI
    }

    return this._isTTY || isForced ? ColorLevel.ANSI : ColorLevel.NO_COLOR
  }

  getTheme(): TerminalTheme {
    if (this._overrideTheme) return this._overrideTheme

    // 1. Check preconditions (must be Node, TTY, etc.)
    if (!this.isNodeEnv() || !this._isTTY) return 'unknown'

    const __dirname = dirname(fileURLToPath(import.meta.url))
    const scriptPath = join(__dirname, './run-osc-querier.js')

    // 2. Execute the spawn safely
    const spawnResult = Result.fromThrowable(
      () =>
        spawnSync(process.execPath, [scriptPath], {
          stdio: ['inherit', 'pipe', 'pipe'],
          timeout: 1000,
          encoding: 'utf-8',
        }),
      error => error
    )()

    // 3. Process the result
    if (spawnResult.isErr()) {
      return 'unknown'
    }

    const processOutput = spawnResult.value

    // Check if the process exited successfully
    if (processOutput.status !== 0 || processOutput.error) {
      return 'unknown'
    }

    // 4. Parse the output string
    const output = processOutput.stdout?.trim()

    if (output === 'dark') return 'dark'
    if (output === 'light') return 'light'

    return 'unknown'
  }
}
