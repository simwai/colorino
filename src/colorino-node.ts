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

export class ColorinoNode
  extends AbstractColorino
  implements ColorinoNodeInterface
{
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
    if (
      this.colorLevel === ColorLevel.NO_COLOR ||
      this.colorLevel === 'UnknownEnv' ||
      this.colorLevel === ColorLevel.ANSI
    ) {
      return text
    }

    const characters = [...text]
    const rgbColors = colorConverter.hex.gradient(
      startHex,
      endHex,
      characters.length
    )

    return (
      characters
        .map((char, index) => {
          const [r, g, b] = rgbColors[index] ?? [0, 0, 0]

          if (this.colorLevel === ColorLevel.TRUECOLOR) {
            return `\x1b[38;2;${r};${g};${b}m${char}`
          }

          const code = colorConverter.rgb.toAnsi256([r, g, b])
          return `\x1b[38;5;${code}m${char}`
        })
        .join('') + '\x1b[0m'
    )
  }

  protected writeToFile(level: LogLevel, args: unknown[], caller?: CallSiteInfo): void {
    const config = this.options.fileLogging
    if (!config?.isEnabled) return

    const fileMin = config.minLevel ?? this.options.logLevel?.min ?? 'trace'
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[fileMin]) return

    const timestamp = new Date().toISOString()
    const message = args.map(arg => {
      if (TypeValidator.isError(arg)) return `${arg.name}: ${arg.message}\n${arg.stack}`
      if (TypeValidator.isObject(arg)) return this.formatValue(arg)
      return String(arg)
    }).join(' ')

    let line = `${timestamp} [${level}] ${message}`

    const metaConfig = this.options.metadata?.callSite
    const isEnabledDefault = true
    const isEnabled = metaConfig?.isEnabled ?? isEnabledDefault

    if (isEnabled && caller) {
      const parts: string[] = []
      if (metaConfig?.isCallerFileVisible ?? true) {
        parts.push(metaConfig?.isCallerPathRelative ? caller.relativePath : caller.filename)
      }
      if (metaConfig?.isCallerLineVisible ?? true) {
        parts.push(metaConfig?.isCallerColumnVisible ?? true ? `${caller.line}:${caller.column}` : `${caller.line}`)
      }
      const location = parts.join(':')
      if (location) line += ` [${location}]`
    }

    this.logQueue.push(line + '\n')
    this.processQueue()
  }

  private async processQueue() {
    if (this.isWriting || this.logQueue.length === 0) return
    this.isWriting = true

    const config = this.options.fileLogging!
    const logPath = path.resolve(process.cwd(), config.path)
    const logDir = path.dirname(logPath)

    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }

      while (this.logQueue.length > 0) {
        const line = this.logQueue.shift()!
        await fs.promises.appendFile(logPath, line, { flag: config.isAppendMode === false ? 'w' : 'a' })
        if (config.isAppendMode === false) {
           config.isAppendMode = true
        }
      }
    } catch (err) {
      console.error('Colorino failed to write to log file:', err)
    } finally {
      this.isWriting = false
    }
  }

  protected formatArgs(
    consoleMethod: ConsoleMethod,
    args: unknown[],
    tags: FormattedTag[]
  ): unknown[] {
    const hasErrorOrStack = args.some(
      arg => TypeValidator.isError(arg) || TypeValidator.isStackLikeString(arg)
    )

    const argsToProcess =
      consoleMethod === 'trace' && !hasErrorOrStack
        ? [...args, this.buildCallerStack()]
        : args

    const paletteHex = this.palette[consoleMethod]
    const ansiPrefix = this.toAnsiPrefix(paletteHex)
    const { prefix, postfix } = this.partitionTags(tags)

    const formattedArgs: unknown[] = []

    for (const tag of prefix) {
      formattedArgs.push(ansiPrefix ? `${ansiPrefix}${tag.text}\x1b[0m` : tag.text)
    }

    let previousWasObject = false

    for (const arg of argsToProcess) {
      if (TypeValidator.isFormattableObject(arg)) {
        const jsonString = this.formatValue(arg)
        const spacedValue = previousWasObject ? jsonString : `\n${jsonString}`
        formattedArgs.push(spacedValue)
        previousWasObject = true
        continue
      }

      if (TypeValidator.isError(arg)) {
        const cleaned = this.cleanErrorStack(arg)

        if (
          !cleaned.name.trim() ||
          !cleaned.message.trim() ||
          !cleaned.stack?.trim()
        ) {
          continue
        }
        const errorHeader = `${cleaned.name}: ${cleaned.message}`
        const stackFrames = cleaned.stack
          ? cleaned.stack.split('\n').slice(1).join('\n')
          : ''

        const coloredHeader = ansiPrefix
          ? `${ansiPrefix}${errorHeader}\x1b[0m`
          : errorHeader
        const fullError = stackFrames
          ? `${coloredHeader}\n${stackFrames}`
          : coloredHeader
        const spacedError = previousWasObject ? fullError : `\n${fullError}`

        formattedArgs.push(spacedError)
        previousWasObject = true
        continue
      }

      if (TypeValidator.isStackLikeString(arg)) {
        const filtered = this.filterStack(arg)

        if (!filtered.trim()) continue

        const lines = filtered.split('\n')
        const firstLine = lines[0] || ''
        const isErrorHeader =
          firstLine.includes('Error') && firstLine.includes(':')

        if (isErrorHeader) {
          const coloredHeader = ansiPrefix
            ? `${ansiPrefix}${firstLine}\x1b[0m`
            : firstLine
          const stackFrames = lines.slice(1).join('\n')

          if (stackFrames) {
            formattedArgs.push(`\n${coloredHeader}\n${stackFrames}`)
          } else {
            formattedArgs.push(`\n${coloredHeader}`)
          }
        } else {
          formattedArgs.push(`\n${filtered}`)
        }

        previousWasObject = true
        continue
      }

      if (TypeValidator.isString(arg)) {
        const shouldColor =
          !TypeValidator.isAnsiColoredString(arg) &&
          !TypeValidator.isStackLikeString(arg)

        const spacedArg = previousWasObject ? `\n${arg}` : arg

        formattedArgs.push(
          ansiPrefix && shouldColor
            ? `${ansiPrefix}${spacedArg}\x1b[0m`
            : spacedArg
        )
        previousWasObject = false
        continue
      }

      formattedArgs.push(arg)
      previousWasObject = false
    }

    for (const tag of postfix) {
      formattedArgs.push(ansiPrefix ? `${ansiPrefix}${tag.text}\x1b[0m` : tag.text)
    }

    return formattedArgs
  }

  protected isBrowser(): boolean {
    return false
  }

  protected override toAnsiPrefix(hex: string): string {
    if (
      this.colorLevel === ColorLevel.NO_COLOR ||
      this.colorLevel === 'UnknownEnv'
    ) {
      return ''
    }

    switch (this.colorLevel) {
      case ColorLevel.TRUECOLOR: {
        const [r, g, b] = colorConverter.hex.toRgb(hex)
        return `\x1b[38;2;${r};${g};${b}m`
      }
      case ColorLevel.ANSI256: {
        const code = colorConverter.hex.toAnsi256(hex)
        return `\x1b[38;5;${code}m`
      }
      case ColorLevel.ANSI:
      default: {
        const code = colorConverter.hex.toAnsi16(hex)
        return `\x1b[${code}m`
      }
    }
  }
}
