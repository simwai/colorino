import { describe, it, expect, vi, afterEach } from 'vitest'
import { createColorino } from '../../browser.js'
import { createTestPalette } from '../helpers/test-setup.js'

describe('Colorino - Browser Environment - Integration Test', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not warn about color support in a browser environment', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn')
    createColorino(createTestPalette())
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  it('should format a simple string', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const logger = createColorino(createTestPalette({ log: '#00ff00' }))
    logger.log('Browser console test')
    const callArgs = consoleSpy.mock.calls[0]
    expect(callArgs?.length).toBe(2)
    expect(callArgs?.[0]).toBe('%cBrowser console test')
    expect(callArgs?.[1]).toBe('color:#00ff00')
  })

  it('should handle multiple arguments and objects correctly', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const logger = createColorino(createTestPalette({ log: '#ffffff' }))

    const testObject = { browser: true, id: 123 }
    logger.log('Object data:', testObject)
    const callArgs = consoleSpy.mock.calls[0]
    expect(callArgs?.length).toBe(3)
    expect(callArgs?.[0]).toBe('%cObject data:')
    expect(callArgs?.[1]).toBe('color:#ffffff')
    expect(callArgs?.[2]).toEqual(testObject)
  })

  it('should handle all standard log levels without throwing', () => {
    const logger = createColorino(createTestPalette())
    expect(() => {
      logger.log('log message')
      logger.error('error message')
      logger.warn('warn message')
      logger.info('info message')
      logger.debug('debug message')
      logger.trace('trace message')
    }).not.toThrow()
  })
})
