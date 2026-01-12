import { ok, err, Result } from 'neverthrow'
import { InputValidationError } from './errors.js'
import type { Palette } from './types.js'
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
      if (result.isErr()) return err(result.error)
    }

    return ok(true)
  }
}
