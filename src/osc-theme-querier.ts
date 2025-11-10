import { Result, ok, err } from 'neverthrow'
import type { ReadStream, WriteStream } from 'node:tty'
import { OscQueryError } from './errors.js'

export type TerminalTheme = 'dark' | 'light' | 'unknown'

export class OscThemeQuerier {
  private cachedResult?: Result<TerminalTheme, OscQueryError>
  private cacheTimestamp?: number

  constructor(
    private readonly _stdin: ReadStream,
    private readonly _stdout: WriteStream,
    private readonly _timeout = 300,
    private readonly _cacheTtl = 3600000
  ) {}

  async query(): Promise<Result<TerminalTheme, OscQueryError>> {
    if (!this._stdout.isTTY || typeof this._stdin.setRawMode !== 'function') {
      return err(new OscQueryError('Not a TTY environment'))
    }

    const now = Date.now()

    if (
      this.cachedResult !== undefined &&
      this.cacheTimestamp !== undefined &&
      now - this.cacheTimestamp < this._cacheTtl
    ) {
      return this.cachedResult
    }

    const result = await this._performQuery()

    this.cachedResult = result
    this.cacheTimestamp = now

    return result
  }

  private async _performQuery(): Promise<Result<TerminalTheme, OscQueryError>> {
    return new Promise(resolve => {
      const originalRawMode = this._stdin.isRaw
      let buffer = ''
      let isResolved = false

      const cleanup = () => {
        if (isResolved) return
        isResolved = true

        clearTimeout(timer)
        this._stdin.removeListener('data', onData)
        this._stdin.setRawMode(originalRawMode)
      }

      const onData = (chunk: string | Buffer) => {
        buffer += chunk.toString()

        const parseResult = this._parseResponse(buffer)

        if (parseResult.isOk()) {
          cleanup()
          resolve(parseResult)
        }
      }

      const timer = setTimeout(() => {
        cleanup()
        resolve(
          err(new OscQueryError('OSC query timeout - terminal did not respond'))
        )
      }, this._timeout)

      this._stdin.setRawMode(true)
      this._stdin.on('data', onData)

      this._stdout.write('\x1b]11;?\x1b\\')
    })
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
