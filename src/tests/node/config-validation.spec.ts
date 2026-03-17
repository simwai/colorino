import { describe, it, expect } from 'vitest'
import { createColorino } from '../../node.js'
import { ColorinoConfigError } from '../../errors.js'

describe('Colorino - Config Validation', () => {
  it('should throw ColorinoConfigError for invalid maxDepth', () => {
    expect(() => createColorino({}, { maxDepth: -1 })).toThrow(ColorinoConfigError)
  })
})
