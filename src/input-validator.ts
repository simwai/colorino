import { ok, err, Result } from 'neverthrow'
import { ColorinoError } from './errors.js'
import type { Palette } from './types.js'

export class InputValidator {
  validateHex(hex: string): Result<boolean, ColorinoError> {
    // Trim whitespace before validating
    const trimmedHex = hex.trim()
    const isHexValid = /^#[0-9A-F]{6}$/i.test(trimmedHex)
    if (!isHexValid) {
      return err(new ColorinoError(`Invalid hex color: '${hex}'`))
    }
    return ok(true)
  }

  validatePalette(palette: Palette): Result<boolean, ColorinoError> {
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
