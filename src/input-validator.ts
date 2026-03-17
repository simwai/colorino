import { ok, err, Result } from 'neverthrow'
import { InputValidationError, ColorinoConfigError } from './errors.js'
import type { Palette, LogLevel } from './types.js'
import { TypeValidator } from './type-validator.js'
import { ColorinoOptions } from './interfaces.js'

export class InputValidator {
  validateHex(hex: string): Result<boolean, InputValidationError> {
    const inputValidationError = new InputValidationError(
      `Invalid hex color: '${hex}'`
    )
    if (!TypeValidator.isString(hex)) return err(inputValidationError)

    const trimmedHex = hex.trim()
    const isHexValid = /^#[0-9A-F]{6}$/i.test(trimmedHex)
    if (!isHexValid) return err(inputValidationError)

    return ok(true)
  }

  validatePalette(palette: Palette): Result<boolean, InputValidationError> {
    const inputValidationerror = new InputValidationError(`Invalid log method`)
    for (const level in palette) {
      if (!TypeValidator.isConsoleMethod(level))
        return err(inputValidationerror)

      const hex = palette[level as keyof Palette]
      const result = this.validateHex(hex)
      if (result.isErr()) return err(result.error)
    }

    return ok(true)
  }

  validateOptions(options: ColorinoOptions): Result<boolean, ColorinoConfigError> {
    if (options.maxDepth !== undefined) {
      if (!Number.isInteger(options.maxDepth) || options.maxDepth < 0 || options.maxDepth > 100) {
        return err(new ColorinoConfigError('maxDepth', 'must be an integer between 0 and 100', options.maxDepth))
      }
    }

    if (options.logLevel) {
      if (options.logLevel.min && !this.isValidLogLevel(options.logLevel.min)) {
        return err(new ColorinoConfigError('logLevel.min', 'invalid log level', options.logLevel.min))
      }
      if (options.logLevel.allow) {
        for (const level of options.logLevel.allow) {
          if (!this.isValidLogLevel(level)) {
            return err(new ColorinoConfigError('logLevel.allow', 'contains invalid log level', level))
          }
        }
      }
      if (options.logLevel.deny) {
        for (const level of options.logLevel.deny) {
          if (!this.isValidLogLevel(level)) {
            return err(new ColorinoConfigError('logLevel.deny', 'contains invalid log level', level))
          }
        }
      }
    }

    if (options.fileLogging) {
      if (typeof options.fileLogging.isEnabled !== 'boolean') {
        return err(new ColorinoConfigError('fileLogging.isEnabled', 'must be a boolean', options.fileLogging.isEnabled))
      }
      if (typeof options.fileLogging.path !== 'string' || !options.fileLogging.path) {
        return err(new ColorinoConfigError('fileLogging.path', 'must be a non-empty string', options.fileLogging.path))
      }
    }

    return ok(true)
  }

  private isValidLogLevel(level: unknown): level is LogLevel {
    return (['trace', 'debug', 'log', 'info', 'warn', 'error'] as unknown[]).includes(level)
  }
}
