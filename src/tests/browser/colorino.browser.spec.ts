import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Colorino } from '../../colorino.js'
import { InputValidator } from '../../input-validator.js'
import { BrowserColorSupportDetector } from '../../browser-color-support-detector.js'
import { createTestPalette } from '../helpers/test-setup.js'

describe('Colorino - Browser Environment', () => {
  let validator: InputValidator
  let browserDetector: BrowserColorSupportDetector
  let logger: Colorino

  // Runs before each test, setting up a clean environment.
  beforeEach(() => {
    // Instantiate dependencies for each test for maximum isolation.
    validator = new InputValidator()
    browserDetector = new BrowserColorSupportDetector(window, navigator)

    // Create a default logger instance for general use in tests.
    logger = new Colorino(
      createTestPalette({ log: '#00ff00' }), // Use the helper
      validator,
      browserDetector,
      undefined, // No node detector in browser tests
      { disableWarnings: true }
    )
  })

  // Runs after each test, cleaning up any mocks or spies.
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should detect the browser environment correctly', () => {
    // This test simply validates that the test runner (e.g., Vitest with jsdom) is set up correctly.
    expect(typeof window).not.toBe('undefined')
    expect(typeof document).not.toBe('undefined')
  })

  it('should not warn about color support in a browser environment', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn')

    // Action: The constructor is what triggers the warning logic.
    // We create a new instance here just to test the constructor's side effect.
    new Colorino(createTestPalette(), validator, browserDetector)

    // Assert: No warning should be issued in the browser.
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  it('should handle multiple log levels without throwing', () => {
    // The logger is already created by `beforeEach`. We just need to act.
    expect(() => {
      logger.log('log message')
      logger.error('error message')
      logger.warn('warn message')
    }).not.toThrow()
  })

  it('should format objects by passing them directly to the console', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    logger.log('Object data:', { browser: true, id: 123 })

    // Assert: In browsers, styled logs pass the style string first, then the raw object.
    // This allows the browser's own console to render the object interactively.
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('%cObject data:'), // The string part with the CSS flag
      expect.any(String), // The CSS style string
      { browser: true, id: 123 } // The raw object passed as the third argument
    )
  })

  it('should correctly call console.log for a simple string message', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    logger.log('Browser console test')

    // Assert: A styled string and its corresponding CSS are passed to console.log.
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('%cBrowser console test'),
      expect.stringContaining('color:#00ff00')
    )
  })
})
