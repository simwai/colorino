import { ok, err, Result } from 'neverthrow'
import { InputValidationError } from './errors.js'
import type { Palette } from './types.js'

export class InputValidator {
  validateHex(hex: string): Result<boolean, InputValidationError> {
    const trimmedHex = hex.trim()
    const isHexValid = /^#[0-9A-F]{6}$/i.test(trimmedHex)
    if (!isHexValid) {
      return err(new InputValidationError(`Invalid hex color: '${hex}'`))
    }
    return ok(true)
  }

  validatePalette(palette: Palette): Result<boolean, InputValidationError> {
    for (const level in palette) {
      const hex = palette[level as keyof Palette]
      const result = this.validateHex(hex)
      if (result.isErr()) {
        return err(result.error)
      }
    }
    return ok(true)
  }
}