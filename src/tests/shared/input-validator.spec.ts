import { describe, it, expect } from 'vitest'
import { validateHex, validatePalette } from '../../input-validator.js'

describe('InputValidator - Shared Environemnt - Unit Test', () => {
  describe('validateHex', () => {
    it('should return ok for valid hex', () => {
      const result = validateHex('#FF0000')
      expect(result.isOk()).toBe(true)
    })

    it('should return error for invalid hex', () => {
      const result = validateHex('invalid')
      expect(result.isErr()).toBe(true)
    })
  })

  describe('validatePalette', () => {
    it('should return ok for valid palette', () => {
      const palette = {
        log: '#FFFFFF',
        info: '#0000FF',
        warn: '#FFFF00',
        error: '#FF0000',
        debug: '#00FF00',
        trace: '#808080',
      }
      const result = validatePalette(palette)
      expect(result.isOk()).toBe(true)
    })

    it('should return error if a log method is invalid', () => {
      const palette = {
        invalid: '#FFFFFF',
      } as any
      const result = validatePalette(palette)
      expect(result.isErr()).toBe(true)
    })

    it('should return error if a hex color is invalid', () => {
      const palette = {
        log: 'invalid',
        info: '#0000FF',
        warn: '#FFFF00',
        error: '#FF0000',
        debug: '#00FF00',
        trace: '#808080',
      }
      const result = validatePalette(palette)
      expect(result.isErr()).toBe(true)
    })
  })
})
