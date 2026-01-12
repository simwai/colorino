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

  public override trace(...args: unknown[]): void {
    const hasErrorOrStack = args.some(
      arg => TypeValidator.isError(arg) || TypeValidator.isStackLikeString(arg)
    )
    const stack = hasErrorOrStack ? undefined : this._buildCallerStack()
    const coloredArgs = args.map(arg => {
      if (
        TypeValidator.isString(arg) &&
        !TypeValidator.isAnsiColoredString(arg) &&
        !TypeValidator.isStackLikeString(arg)
      ) {
        const prefix = this.toAnsiPrefix(this.palette.trace)
        return prefix ? `${prefix}${arg}\x1b[0m` : arg
      }
      return arg
    })

    const finalArgs: unknown[] = stack ? [...coloredArgs, stack] : coloredArgs

    this.out('log', finalArgs)
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

  protected applyColors(
    consoleMethod: ConsoleMethod,
    args: unknown[]
  ): unknown[] {
    const paletteHex = this.palette[consoleMethod]
    const prefix = this.toAnsiPrefix(paletteHex)

    if (!prefix) return args

    return args.map(arg => {
      if (TypeValidator.isError(arg)) {
        return this._formatErrorWithAnsiPrefix(arg, prefix)
      } else if (
        !TypeValidator.isString(arg) ||
        TypeValidator.isStackLikeString(arg) ||
        TypeValidator.isAnsiColoredString(arg)
      ) {
        return arg
      }

      return `${prefix}${String(arg)}\x1b[0m`
    })
  }

  protected processArgs(args: unknown[]): unknown[] {
    const processedArgs: unknown[] = []
    let previousWasObject = false

    for (const arg of args) {
      if (TypeValidator.isFormattableObject(arg)) {
        processedArgs.push(`\n${this.formatValue(arg)}`)
        previousWasObject = true
        continue
      }

      if (TypeValidator.isError(arg) || TypeValidator.isStackLikeString(arg)) {
        processedArgs.push(`\n${this.filterStack(arg)}`)
        previousWasObject = true
        continue
      }

      if (TypeValidator.isString(arg) && previousWasObject) {
        processedArgs.push(`\n${arg}`)
      } else {
        processedArgs.push(arg)
      }

      previousWasObject = TypeValidator.isFormattableObject(arg)
    }

    return processedArgs
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

  private _formatErrorWithAnsiPrefix(error: Error, ansiPrefix: string): string {
    const errorHeader = `${error.name}: ${error.message}`
    const stackFrames = error.stack
      ? this.filterStack(error.stack).split('\n').slice(1).join('\n')
      : ''
    return `${ansiPrefix}${errorHeader}${stackFrames ? `\n${stackFrames}` : ''}\x1b[0m`
  }
}
