import { describe, it, expect } from 'vitest'
import { createColorino } from '../../node.js'
import { ColorinoConfigError } from '../../errors.js'

describe('Colorino - Config Validation', () => {
  it('should throw ColorinoConfigError for invalid maxDepth', () => {
    expect(() => createColorino({}, { maxDepth: -1 })).toThrow(ColorinoConfigError)
    expect(() => createColorino({}, { maxDepth: 101 })).toThrow(ColorinoConfigError)
    expect(() => createColorino({}, { maxDepth: 5.5 })).toThrow(ColorinoConfigError)
  })

  it('should throw ColorinoConfigError for invalid logLevel.min', () => {
    // @ts-expect-error
    expect(() => createColorino({}, { logLevel: { min: 'invalid' } })).toThrow(ColorinoConfigError)
  })

  it('should throw ColorinoConfigError for invalid fileLogging path', () => {
    expect(() => createColorino({}, { fileLogging: { isEnabled: true, path: '' } })).toThrow(ColorinoConfigError)
  })
})
