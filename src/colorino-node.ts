import { AbstractColorino } from './abstract-colorino.js'
import { ColorLevel } from './enums.js'
import { ConsoleMethod } from './types.js'
import { TypeValidator } from './type-validator.js'
import { colorConverter } from './color-converter.js'
import { Palette } from './types.js'
import { ColorinoNodeInterface, ColorinoOptions } from './interfaces.js'
import { InputValidator } from './input-validator.js'

export class ColorinoNode
  extends AbstractColorino
  implements ColorinoNodeInterface
{
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

  protected formatArgs(
    consoleMethod: ConsoleMethod,
    args: unknown[]
  ): unknown[] {
    const hasErrorOrStack = args.some(
      arg => TypeValidator.isError(arg) || TypeValidator.isStackLikeString(arg)
    )

    const argsToProcess =
      consoleMethod === 'trace' && !hasErrorOrStack
        ? [...args, this._buildCallerStack()]
        : args

    const paletteHex = this.palette[consoleMethod]
    const ansiPrefix = this.toAnsiPrefix(paletteHex)

    const formattedArgs: unknown[] = []
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

        if (!filtered.trim()) {
          continue
        }

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

  private _buildCallerStack(): string | undefined {
    const error = new Error('Trace')

    if (!error.stack) return undefined

    const lines = error.stack.split('\n')
    const stackFrames = lines.slice(1).join('\n')

    return this.filterStack(stackFrames)
  }
}
