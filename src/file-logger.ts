import {
  appendFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  statSync,
} from 'node:fs'
import { dirname } from 'node:path'
import type { ColorinoFileLoggingOptions } from './interfaces.js'

const ansiPattern = new RegExp(
  `${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`,
  'g'
)

export class ColorinoFileLogger {
  private readonly path: string
  private readonly maxBytes: number
  private readonly maxFiles: number
  private readonly stripAnsi: boolean
  private readonly timezone: string | undefined

  constructor(options: ColorinoFileLoggingOptions) {
    this.path = options.path
    this.maxBytes = options.maxBytes ?? 10 * 1024 * 1024
    this.maxFiles = options.maxFiles ?? 5
    this.stripAnsi = options.stripAnsi ?? true
    this.timezone = options.timezone === 'local' ? undefined : options.timezone

    if (!this.path.trim()) throw new Error('File logging path cannot be empty')
    if (this.maxBytes <= 0)
      throw new Error('File logging maxBytes must be positive')
    if (this.maxFiles < 1)
      throw new Error('File logging maxFiles must be positive')

    mkdirSync(dirname(this.path), { recursive: true })
  }

  write(
    level: string,
    args: unknown[],
    formatValue: (value: unknown) => string
  ): void {
    const content = args
      .map(arg => (typeof arg === 'string' ? arg : formatValue(arg)))
      .join(' ')
    const output = this.stripAnsi ? content.replace(ansiPattern, '') : content
    const line = `[${this.timestamp()}] ${level.toUpperCase()} ${output}\n`
    this.rotateIfNeeded(Buffer.byteLength(line, 'utf8'))
    appendFileSync(this.path, line, 'utf8')
  }

  private rotateIfNeeded(incomingBytes: number): void {
    if (!existsSync(this.path)) return
    if (statSync(this.path).size + incomingBytes <= this.maxBytes) return

    for (let index = this.maxFiles - 1; index >= 1; index--) {
      const source = `${this.path}.${index}`
      const destination = `${this.path}.${index + 1}`
      if (!existsSync(source)) continue
      if (existsSync(destination)) rmSync(destination)
      renameSync(source, destination)
    }

    const firstRotation = `${this.path}.1`
    if (existsSync(firstRotation)) rmSync(firstRotation)
    renameSync(this.path, firstRotation)
  }

  private timestamp(): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      dateStyle: 'short',
      timeStyle: 'medium',
      hour12: false,
      timeZone: this.timezone,
    }).formatToParts(new Date())
    const values = Object.fromEntries(
      parts.map(part => [part.type, part.value])
    )

    return `${values['year']}-${values['month']}-${values['day']}T${values['hour']}:${values['minute']}:${values['second']}`
  }
}
