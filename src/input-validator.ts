import { ok, err, Result } from 'neverthrow'
import { InputValidationError } from './errors.js'
import type { Palette } from './types.js'
import { isConsoleMethod, isString } from './type-validator.js'

// @__NO_SIDE_EFFECTS__
export function validateHex(
  hex: string
): Result<boolean, InputValidationError> {
  const inputValidationError = new InputValidationError(
    `Invalid hex color: '${hex}'`
  )
  if (!isString(hex)) return err(inputValidationError)

  const trimmedHex = hex.trim()
  const isHexValid = /^#[0-9A-F]{6}$/i.test(trimmedHex)
  if (!isHexValid) return err(inputValidationError)

  return ok(true)
}

// @__NO_SIDE_EFFECTS__
export function validatePalette(
  palette: Palette
): Result<boolean, InputValidationError> {
  const inputValidationerror = new InputValidationError(`Invalid log method`)
  for (const level in palette) {
    if (!isConsoleMethod(level)) return err(inputValidationerror)

    const hex = palette[level]
    const result = validateHex(hex)
    if (result.isErr()) return err(result.error)
  }

  return ok(true)
}

/** @deprecated Use standalone functions instead */
export class InputValidator {
  validateHex(hex: string) {
    return validateHex(hex)
  }
  validatePalette(palette: Palette) {
    return validatePalette(palette)
  }
}
