import { Result, ok, err } from 'neverthrow'
import type { ReadStream, WriteStream } from 'node:tty'
import { spawnSync } from 'node:child_process'
import { OscQueryError } from './errors.js'
import type { TerminalTheme } from './types.js'

export class OscThemeQuerier {
  private _cachedResult?: Result<TerminalTheme, OscQueryError>
  private _cacheTimestamp?: number

  constructor(
    private readonly _stdin: ReadStream,
    private readonly _stdout: WriteStream,
    private readonly _timeout = 300,
    private readonly _cacheTtl = 3600000
  ) {}

  query(): Result<TerminalTheme, OscQueryError> {
    if (!this._stdout.isTTY || typeof this._stdin.setRawMode !== 'function') {
      return err(new OscQueryError('Not a TTY environment'))
    }

    const now = Date.now()

    if (
      this._cachedResult !== undefined &&
      this._cacheTimestamp !== undefined &&
      now - this._cacheTimestamp < this._cacheTtl
    ) {
      return this._cachedResult
    }

    const result = this._performQuery()

    this._cachedResult = result
    this._cacheTimestamp = now

    return result
  }

  private _performQuery(): Result<TerminalTheme, OscQueryError> {
    const originalRawMode = this._stdin.isRaw
    let buffer = ''

    this._stdin.setRawMode(true)
    this._stdin.resume()

    this._stdout.write('\x1b]11;?\x1b\\')

    const startTime = Date.now()
    const pollInterval = 10

    while (Date.now() - startTime < this._timeout) {
      const chunk = this._stdin.read()

      if (chunk !== null) {
        buffer += chunk.toString()

        const parseResult = this._parseResponse(buffer)

        if (parseResult.isOk()) {
          this._cleanup(originalRawMode)
          return parseResult
        }
      }

      this._sleepSync(pollInterval)
    }

    this._cleanup(originalRawMode)
    return err(
      new OscQueryError('OSC query timeout - terminal did not respond')
    )
  }

  private _cleanup(originalRawMode: boolean): void {
    this._stdin.setRawMode(originalRawMode)
    this._stdin.pause()
  }

  private _sleepSync(ms: number): void {
    if (process.platform === 'win32') {
      spawnSync('timeout', ['/T', String(Math.ceil(ms / 1000)), '/NOBREAK'], {
        stdio: 'ignore',
        shell: true,
      })
    } else {
      spawnSync('sleep', [String(ms / 1000)], { stdio: 'ignore' })
    }
  }

  private _parseResponse(
    response: string
  ): Result<TerminalTheme, OscQueryError> {
    const rgbMatch = response.match(
      /rgb:([0-9a-f]{2,4})\/([0-9a-f]{2,4})\/([0-9a-f]{2,4})/i
    )

    if (!rgbMatch) {
      return err(new OscQueryError('No valid OSC response found in buffer'))
    }

    const red = this._normalizeHex(rgbMatch[1]!)
    const green = this._normalizeHex(rgbMatch[2]!)
    const blue = this._normalizeHex(rgbMatch[3]!)

    const luminance = this._calculateLuminance(red, green, blue)

    return ok(luminance < 0.5 ? 'dark' : 'light')
  }

  private _normalizeHex(hexValue: string): number {
    const normalized = hexValue.padEnd(4, '0').slice(0, 2)
    return parseInt(normalized, 16)
  }

  private _calculateLuminance(
    red: number,
    green: number,
    blue: number
  ): number {
    return (0.299 * red + 0.587 * green + 0.114 * blue) / 255
  }
}
