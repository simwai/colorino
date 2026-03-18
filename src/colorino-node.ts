import * as fs from 'node:fs'
import * as path from 'node:path'
import { AbstractColorino } from './abstract-colorino.js'
import { ColorLevel } from './enums.js'
import {
  ConsoleMethod,
  Palette,
  LogLevel,
  FormattedTag,
  CallSiteInfo,
  LOG_LEVEL_PRIORITY,
} from './types.js'
import { ColorinoNodeInterface, ColorinoOptions } from './interfaces.js'
import { TypeValidator } from './type-validator.js'
import { colorConverter } from './color-converter.js'
import { InputValidator } from './input-validator.js'

export class ColorinoNode extends AbstractColorino implements ColorinoNodeInterface {
  private logQueue: string[] = []
  private isWriting = false

  constructor(
    initialPalette: Palette,
    userPalette: Partial<Palette>,
    validator: InputValidator,
    colorLevel: ColorLevel | 'UnknownEnv',
    options: ColorinoOptions = {}
  ) {
    super(initialPalette, userPalette, validator, colorLevel, options)
  }

  public gradient(text: string, startHex: string, endHex: string): string {
    const noColor = this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv'
    if (noColor || this.colorLevel === ColorLevel.ANSI) {
      return text
    }

    const characters = Array.from(text)
    const colors = colorConverter.hex.gradient(startHex, endHex, characters.length)

    const coloredText = characters.map((char, index) => {
      const rgb = colors[index] || [0, 0, 0]
      const [r, g, b] = rgb

      if (this.colorLevel === ColorLevel.TRUECOLOR) {
        return `\x1b[38;2;${r};${g};${b}m${char}`
      }

      const ansi256 = colorConverter.rgb.toAnsi256(rgb)
      return `\x1b[38;5;${ansi256}m${char}`
    }).join('')

    return `${coloredText}\x1b[0m`
  }

  protected writeToFile(level: LogLevel, args: unknown[], caller?: CallSiteInfo): void {
    const config = this.options.fileLogging
    if (!config?.isEnabled) {
      return
    }

    const minLevel = config.minLevel ?? this.options.logLevel?.min ?? 'trace'
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[minLevel]) {
      return
    }

    const message = args.map(arg => {
      if (TypeValidator.isError(arg)) {
        return `${arg.name}: ${arg.message}\n${arg.stack}`
      }
      if (TypeValidator.isObject(arg)) {
        return this.formatValue(arg)
      }
      return String(arg)
    }).join(' ')

    const timestamp = new Date().toISOString()
    let logLine = `${timestamp} [${level}] ${message}`

    const metadata = this.options.metadata?.callSite
    const isMetadataEnabled = metadata?.isEnabled ?? false
    if (isMetadataEnabled && caller) {
      const file = metadata?.isCallerPathRelative ? caller.relativePath : caller.filename
      const location = `${file}:${caller.line}:${caller.column}`
      logLine += ` [${location}]`
    }

    this.logQueue.push(`${logLine}\n`)
    this.processQueue()
  }

  private async processQueue() {
    if (this.isWriting || this.logQueue.length === 0) {
      return
    }

    this.isWriting = true
    const config = this.options.fileLogging!
    const logPath = path.resolve(process.cwd(), config.path)

    try {
      const directory = path.dirname(logPath)
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true })
      }

      while (this.logQueue.length > 0) {
        const line = this.logQueue.shift()!
        const flag = config.isAppendMode === false ? 'w' : 'a'

        await fs.promises.appendFile(logPath, line, { flag })

        if (config.isAppendMode === false) {
           config.isAppendMode = true
        }
      }
    } catch (error) {
      console.error('Colorino: Failed to write to log file:', error)
    } finally {
      this.isWriting = false
    }
  }

  protected formatArgs(method: ConsoleMethod, args: unknown[], tags: FormattedTag[] = []): unknown[] {
    const hasError = args.some(arg => TypeValidator.isError(arg) || TypeValidator.isStackLikeString(arg))
    const toProcess = (method === 'trace' && !hasError)
      ? [...args, this.buildCallerStack()]
      : args

    const colorHex = this.palette[method] || '#ffffff'
    const ansiPrefix = this.toAnsiPrefix(colorHex)

    const { prefix, postfix } = this.partitionTags(tags)
    const result: unknown[] = []

    // Prepend prefix tags
    for (const tag of prefix) {
      const coloredTag = ansiPrefix ? `${ansiPrefix}${tag.text}\x1b[0m` : tag.text
      result.push(coloredTag)
    }

    let lastWasObject = false
    for (const arg of toProcess) {
      if (TypeValidator.isFormattableObject(arg)) {
        result.push(`\n${this.formatValue(arg)}`)
        lastWasObject = true
      } else if (TypeValidator.isError(arg)) {
        const cleaned = this.cleanErrorStack(arg)
        if (!cleaned.name.trim() || !cleaned.message.trim() || !cleaned.stack?.trim()) {
          continue
        }

        const header = `${cleaned.name}: ${cleaned.message}`
        const stackLines = cleaned.stack.split('\n').slice(1).join('\n')
        const formatted = stackLines
          ? `${ansiPrefix ? `${ansiPrefix}${header}\x1b[0m` : header}\n${stackLines}`
          : (ansiPrefix ? `${ansiPrefix}${header}\x1b[0m` : header)

        result.push(lastWasObject ? formatted : `\n${formatted}`)
        lastWasObject = true
      } else if (TypeValidator.isStackLikeString(arg)) {
        const filtered = this.filterStack(arg)
        if (!filtered.trim()) {
          continue
        }

        const lines = filtered.split('\n')
        const hasErrorHeader = lines[0]?.includes('Error') && lines[0]?.includes(':')

        if (hasErrorHeader) {
          const header = ansiPrefix ? `${ansiPrefix}${lines[0]}\x1b[0m` : lines[0]
          const body = lines.slice(1).join('\n')
          result.push(`\n${body ? `${header}\n${body}` : header}`)
        } else {
          result.push(`\n${filtered}`)
        }
        lastWasObject = true
      } else if (TypeValidator.isString(arg)) {
        const str = lastWasObject ? `\n${arg}` : arg
        const shouldColor = ansiPrefix && !TypeValidator.isAnsiColoredString(arg) && !TypeValidator.isStackLikeString(arg)

        result.push(shouldColor ? `${ansiPrefix}${str}\x1b[0m` : str)
        lastWasObject = false
      } else {
        result.push(arg)
        lastWasObject = false
      }
    }

    // Append postfix tags
    for (const tag of postfix) {
      const coloredTag = ansiPrefix ? `${ansiPrefix}${tag.text}\x1b[0m` : tag.text
      result.push(coloredTag)
    }

    return result
  }

  protected isBrowser(): boolean {
    return false
  }

  protected override toAnsiPrefix(hex: string): string {
    const noColor = this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv'
    if (noColor) {
      return ''
    }

    if (this.colorLevel === ColorLevel.TRUECOLOR) {
      const [r, g, b] = colorConverter.hex.toRgb(hex)
      return `\x1b[38;2;${r};${g};${b}m`
    }

    if (this.colorLevel === ColorLevel.ANSI256) {
      const ansi256 = colorConverter.hex.toAnsi256(hex)
      return `\x1b[38;5;${ansi256}m`
    }

    const ansi16 = colorConverter.hex.toAnsi16(hex)
    return `\x1b[${ansi16}m`
  }
}
