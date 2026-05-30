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

  /** Validates ColorinoOptions at runtime. */
  validateOptions(options: ColorinoOptions): Result<boolean, ColorinoConfigError> {
    if (options.maxDepth !== undefined) {
      if (!Number.isInteger(options.maxDepth) || options.maxDepth < 0 || options.maxDepth > 100) {
        return err(new ColorinoConfigError('maxDepth', 'must be integer 0-100', options.maxDepth))
      }
    }

    if (options.logLevel) {
      const { min: minimumLevel, allow: allowedLevels, deny: deniedLevels } = options.logLevel

      if (minimumLevel && !this.isValidLogLevel(minimumLevel)) {
        return err(new ColorinoConfigError('logLevel.min', 'invalid level', minimumLevel))
      }

      if (allowedLevels?.some(level => !this.isValidLogLevel(level))) {
        return err(new ColorinoConfigError('logLevel.allow', 'invalid level in list', allowedLevels))
      }

      if (deniedLevels?.some(level => !this.isValidLogLevel(level))) {
        return err(new ColorinoConfigError('logLevel.deny', 'invalid level in list', deniedLevels))
      }
    }

    if (options.fileLogging) {
      const { isEnabled, path: logFilePath } = options.fileLogging

      if (typeof isEnabled !== 'boolean') {
        return err(new ColorinoConfigError('fileLogging.isEnabled', 'must be boolean', isEnabled))
      }

      if (typeof logFilePath !== 'string' || !logFilePath) {
        return err(new ColorinoConfigError('fileLogging.path', 'must be non-empty string', logFilePath))
      }
    }

    return ok(true)
  }

  private isValidLogLevel(level: unknown): level is LogLevel {
    const validLevels: LogLevel[] = ['trace', 'debug', 'log', 'info', 'warn', 'error', 'fatal']
    return (validLevels as unknown[]).includes(level)
  }
}
