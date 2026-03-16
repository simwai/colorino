import { describe, it, expect } from 'vitest'
import { InputValidator } from '../../input-validator.js'

describe('InputValidator', () => {
  const validator = new InputValidator()

  describe('validateHex', () => {
    it('should return ok for valid hex', () => {
      const result = validator.validateHex('#ffffff')
      expect(result.isOk()).toBe(true)
    })

    it('should return err for invalid hex', () => {
      const result = validator.validateHex('invalid')
      expect(result.isErr()).toBe(true)
    })
  })

  describe('validateOptions', () => {
    it('should return ok for valid options', () => {
      const result = validator.validateOptions({ maxDepth: 10 })
      expect(result.isOk()).toBe(true)
    })

    it('should return err for invalid maxDepth', () => {
      const result = validator.validateOptions({ maxDepth: 101 })
      expect(result.isErr()).toBe(true)
    })
  })
})
