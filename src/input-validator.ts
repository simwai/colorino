import { ok, err, type Result } from 'super-result'
import { InputValidationError } from './errors.js'
import type { Palette } from './types.js'
import type { ColorinoFileLoggingOptions } from './interfaces.js'
import { TypeValidator } from './type-validator.js'

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

      const hex = palette[level]
      const result = this.validateHex(hex)
      if (!result.ok) return err(result.error)
    }

    return ok(true)
  }

  validateLogLevel(level: string): Result<boolean, InputValidationError> {
    const inputValidationError = new InputValidationError(
      `Invalid log level: '${level}'`
    )
    if (!TypeValidator.isLogLevel(level)) return err(inputValidationError)

    return ok(true)
  }

  validateFileLoggingOptions(
    options: ColorinoFileLoggingOptions
  ): Result<boolean, InputValidationError> {
    if (!options.path.trim()) {
      return err(new InputValidationError('File logging path cannot be empty'))
    }
    if (options.maxBytes !== undefined && options.maxBytes <= 0) {
      return err(
        new InputValidationError('File logging maxBytes must be positive')
      )
    }
    if (options.maxFiles !== undefined && options.maxFiles < 1) {
      return err(
        new InputValidationError('File logging maxFiles must be positive')
      )
    }
    return ok(true)
  }
}
