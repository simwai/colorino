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
import { InputValidator } from './input-validator.js'

const ansiPattern = new RegExp(
  `${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`,
  'g'
)

export class ColorinoFileLogger {
  private path: string
  private readonly maxBytes: number
  private readonly maxFiles: number
  private readonly stripAnsi: boolean
  private readonly timezone: string | undefined
  private readonly validator: InputValidator

  constructor(options: ColorinoFileLoggingOptions, validator: InputValidator) {
    const validationResult = validator.validateFileLoggingOptions(options)
    if (!validationResult.ok) throw validationResult.error

    this.path = options.path
    this.maxBytes = options.maxBytes ?? 10 * 1024 * 1024
    this.maxFiles = options.maxFiles ?? 5
    this.stripAnsi = options.stripAnsi ?? true
    this.timezone = options.timezone === 'local' ? undefined : options.timezone
    this.validator = validator

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

  setPath(newPath: string): void {
    const validationResult = this.validator.validateFileLoggingOptions({
      path: newPath,
      maxBytes: this.maxBytes,
      maxFiles: this.maxFiles,
      stripAnsi: this.stripAnsi,
      timezone: this.timezone === undefined ? 'local' : this.timezone,
    })
    if (!validationResult.ok) throw validationResult.error

    mkdirSync(dirname(newPath), { recursive: true })
    this.path = newPath
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
