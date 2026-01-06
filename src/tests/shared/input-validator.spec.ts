import { describe, it, expect } from 'vitest'
import { InputValidator } from '../../input-validator.js'
import { InputValidationError } from '../../errors.js'
import { createTestPalette } from '../helpers/palette.js'
import { generateRandomString } from '../helpers/random.js'

describe('InputValidator - Node & Browser Environment - Unit Test', () => {
  const validator = new InputValidator()

  describe('validateHex', () => {
    it('should return ok for a valid hex color', () => {
      const result = validator.validateHex('#AABBCC')
      expect(result.isOk()).toBe(true)
    })

    it('should trim whitespace and return ok', () => {
      const result = validator.validateHex('  #AABBCC  ')
      expect(result.isOk()).toBe(true)
    })

    it('should return err for an invalid hex color', () => {
      const result = validator.validateHex('#123')
      expect(result.isErr()).toBe(true)
      const err = result._unsafeUnwrapErr()
      expect(err).toBeInstanceOf(InputValidationError)
      expect(err.message).toBe("Invalid hex color: '#123'")
    })

    it('fuzzing: should return err for random non-hex strings', () => {
      for (let i = 0; i < 100; i++) {
        const randomString = generateRandomString(7)
        // Ensure we don't accidentally generate a valid hex
        if (!/^#[0-9A-F]{6}$/i.test(randomString)) {
          const result = validator.validateHex(randomString)
          expect(result.isErr()).toBe(true)
        }
      }
    })
  })

  describe('validatePalette', () => {
    it('should return ok for a valid palette', () => {
      const palette = createTestPalette()
      const result = validator.validatePalette(palette)
      expect(result.isOk()).toBe(true)
    })

    it('should return err if a palette color is invalid', () => {
      const palette = createTestPalette({ error: 'invalid-hex' })
      const result = validator.validatePalette(palette)
      expect(result.isErr()).toBe(true)
      const err = result._unsafeUnwrapErr()
      expect(err).toBeInstanceOf(InputValidationError)
      expect(err.message).toBe("Invalid hex color: 'invalid-hex'")
    })
  })
})