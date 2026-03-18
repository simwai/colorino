import { ok, err, Result } from 'neverthrow'
import { InputValidationError, ColorinoConfigError } from './errors.js'
import type { Palette, LogLevel } from './types.js'
import { TypeValidator } from './type-validator.js'
import { ColorinoOptions } from './interfaces.js'

export class InputValidator {
  validateHex(hex: string): Result<boolean, InputValidationError> {
    if (!TypeValidator.isString(hex)) {
      return err(new InputValidationError(`Invalid hex color: '${hex}'`))
    }

    const trimmedHex = hex.trim()
    // Support #RRGGBB format
    if (!/^#[0-9A-F]{6}$/i.test(trimmedHex)) {
      return err(new InputValidationError(`Invalid hex color: '${hex}'`))
    }

    return ok(true)
  }

  validatePalette(palette: Partial<Palette>): Result<boolean, InputValidationError> {
    const logMethods = Object.keys(palette)

    for (const logMethod of logMethods) {
      if (!TypeValidator.isConsoleMethod(logMethod)) {
        return err(new InputValidationError(`Invalid log method: ${logMethod}`))
      }

      const hexColor = palette[logMethod as keyof Palette]
      if (hexColor) {
        const validationResult = this.validateHex(hexColor)
        if (validationResult.isErr()) {
          return err(validationResult.error)
        }
      }
    }

    return ok(true)
  }

  /** Validates ColorinoOptions at runtime. */
  validateOptions(options: ColorinoOptions): Result<boolean, ColorinoConfigError> {
    if (options.maxDepth !== undefined) {
      if (!Number.isInteger(options.maxDepth) || options.maxDepth < 0 || options.maxDepth > 100) {
        return err(new ColorinoConfigError('maxDepth', 'must be integer 0-100', options.maxDepth))
      }
    }

    if (options.logLevel) {
      const { min, allow, deny } = options.logLevel

      if (min && !this.isValidLogLevel(min)) {
        return err(new ColorinoConfigError('logLevel.min', 'invalid level', min))
      }

      if (allow?.some(level => !this.isValidLogLevel(level))) {
        return err(new ColorinoConfigError('logLevel.allow', 'invalid level in list', allow))
      }

      if (deny?.some(level => !this.isValidLogLevel(level))) {
        return err(new ColorinoConfigError('logLevel.deny', 'invalid level in list', deny))
      }
    }

    if (options.fileLogging) {
      const { isEnabled, path: logPath } = options.fileLogging

      if (typeof isEnabled !== 'boolean') {
        return err(new ColorinoConfigError('fileLogging.isEnabled', 'must be boolean', isEnabled))
      }

      if (typeof logPath !== 'string' || !logPath) {
        return err(new ColorinoConfigError('fileLogging.path', 'must be non-empty string', logPath))
      }
    }

    return ok(true)
  }

  private isValidLogLevel(level: unknown): level is LogLevel {
    const validLevels: LogLevel[] = ['trace', 'debug', 'log', 'info', 'warn', 'error', 'fatal']
    return (validLevels as unknown[]).includes(level)
  }
}
