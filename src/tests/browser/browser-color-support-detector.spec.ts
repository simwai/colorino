import { describe, it, expect } from 'vitest'
import { BrowserColorSupportDetector } from '../../browser-color-support-detector.js'
import { ColorLevel } from '../../enums.js'

describe('BrowserColorSupportDetector - Browser Environment - Unit Test', () => {
  it('should return false for isBrowserEnv', () => {
    const detector = new BrowserColorSupportDetector(undefined, undefined)
    expect(detector.isBrowserEnv()).toBe(false)
  })

  it('should return NO_COLOR level', () => {
    const detector = new BrowserColorSupportDetector(undefined, undefined)
    expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
  })

  it('should return "unknown" theme', () => {
    const detector = new BrowserColorSupportDetector(undefined, undefined)
    expect(detector.getTheme()).toBe('unknown')
  })
})
