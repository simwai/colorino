import { ok, err, Result } from 'neverthrow'
import { InputValidationError, ColorinoConfigError } from './errors.js'
import type { Palette, LogLevel } from './types.js'
import { TypeValidator } from './type-validator.js'
import { ColorinoOptions } from './interfaces.js'

export class InputValidator {
  validateHex(hex: string): Result<boolean, InputValidationError> {
    if (!TypeValidator.isString(hex)) return err(new InputValidationError(`Invalid hex color: '${hex}'`))
    const trimmed = hex.trim()
    if (!/^#[0-9A-F]{6}$/i.test(trimmed)) return err(new InputValidationError(`Invalid hex color: '${hex}'`))
    return ok(true)
  }

  validatePalette(palette: Palette): Result<boolean, InputValidationError> {
    for (const level in palette) {
      if (!TypeValidator.isConsoleMethod(level)) return err(new InputValidationError(`Invalid log method`))
      const res = this.validateHex(palette[level as keyof Palette])
      if (res.isErr()) return err(res.error)
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
      if (min && !this.isL(min)) return err(new ColorinoConfigError('logLevel.min', 'invalid level', min))
      if (allow?.some(l => !this.isL(l))) return err(new ColorinoConfigError('logLevel.allow', 'invalid level in list', allow))
      if (deny?.some(l => !this.isL(l))) return err(new ColorinoConfigError('logLevel.deny', 'invalid level in list', deny))
    }
    if (options.fileLogging) {
      const { isEnabled, path: p } = options.fileLogging
      if (typeof isEnabled !== 'boolean') return err(new ColorinoConfigError('fileLogging.isEnabled', 'must be boolean', isEnabled))
      if (typeof p !== 'string' || !p) return err(new ColorinoConfigError('fileLogging.path', 'must be non-empty string', p))
    }
    return ok(true)
  }

  private isL(l: unknown): l is LogLevel {
    return (['trace', 'debug', 'log', 'info', 'warn', 'error'] as unknown[]).includes(l)
  }
}
