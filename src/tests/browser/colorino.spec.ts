import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { commands } from 'vitest/browser'
import { createColorino } from '../../browser.js'
import { createTestPalette } from '../helpers/palette.js'
import { ColorLevel } from '../../enums.js'

describe('Colorino - Real Browser - Unit Test', () => {
  let mocks: {
    log: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
    error: ReturnType<typeof vi.spyOn>
    info: ReturnType<typeof vi.spyOn>
    debug: ReturnType<typeof vi.spyOn>
    trace: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    mocks = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      trace: vi.spyOn(console, 'trace').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not warn about color support in a browser environment', () => {
    createColorino(createTestPalette())
    expect(mocks.warn).not.toHaveBeenCalled()
  })

  it('should detect color level in real browser', () => {
    const logger = createColorino(createTestPalette())
    const detector = (logger as any)._browserColorSupportDetector
    const colorLevel = detector?.getColorLevel()

    expect(colorLevel).toBeDefined()
    expect(colorLevel).toBeGreaterThanOrEqual(ColorLevel.ANSI)
  })

  it('should detect dark theme', async () => {
    await commands.emulateColorScheme('dark')

    const logger = createColorino(createTestPalette())
    const theme = (logger as any)._browserColorSupportDetector?.getTheme()

    expect(theme).toBe('dark')
  })

  it('should detect light theme', async () => {
    await commands.emulateColorScheme('light')

    const logger = createColorino(createTestPalette())
    const theme = (logger as any)._browserColorSupportDetector?.getTheme()

    expect(theme).toBe('light')
  })

  it('should format a simple string with correct CSS', () => {
    const logger = createColorino(createTestPalette({ log: '#00ff00' }))
    logger.log('Browser console test')

    expect(mocks.log).toHaveBeenCalledWith(
      '%cBrowser console test',
      'color:#00ff00'
    )
  })

  it('should handle multiple arguments and objects correctly', () => {
    const logger = createColorino(createTestPalette({ log: '#ffffff' }))
    const testObject = { browser: true, id: 123 }

    logger.log('Object data:', testObject)

    expect(mocks.log).toHaveBeenCalledWith(
      '%cObject data:%o',
      'color:#ffffff',
      testObject
    )
  })

  it('should handle all standard log levels without throwing', () => {
    const logger = createColorino(createTestPalette())

    expect(() => {
      logger.log('log')
      logger.error('error')
      logger.warn('warn')
      logger.info('info')
      logger.debug('debug')
      logger.trace('trace')
    }).not.toThrow()

    expect(mocks.log).toHaveBeenCalled()
    expect(mocks.error).toHaveBeenCalled()
    expect(mocks.warn).toHaveBeenCalled()
    expect(mocks.info).toHaveBeenCalled()
    expect(mocks.debug).toHaveBeenCalled()
    expect(mocks.log).toHaveBeenCalled()
  })

  it('should allow manual override with colorize in browser', () => {
    const logger = createColorino(createTestPalette({ log: '#ffffff' }))

    const override = logger.colorize('OVERRIDE', '#ff5733')

    logger.log(override, 'normal')

    expect(mocks.log).toHaveBeenCalledWith(
      '%cOVERRIDE%cnormal',
      'color:#ff5733',
      'color:#ffffff'
    )
  })

  it('should only apply browser override to a single call', () => {
    const logger = createColorino(createTestPalette({ log: '#00ff00' }))

    const override = logger.colorize('OVERRIDE', '#ff5733')

    logger.log(override, 'first')

    expect(mocks.log).toHaveBeenNthCalledWith(
      1,
      '%cOVERRIDE%cfirst',
      'color:#ff5733',
      'color:#00ff00'
    )

    logger.log('second')

    expect(mocks.log).toHaveBeenNthCalledWith(2, '%csecond', 'color:#00ff00')
  })

  it('should support mixed manual overrides, plain strings, and objects in browser', () => {
    const logger = createColorino(createTestPalette({ log: '#00ff00' }))
    const first = logger.colorize('FIRST', '#ff0000')
    const second = logger.colorize('SECOND', '#0000ff')
    const meta = { id: 1 }

    logger.log('pre', first, 'mid', meta, second, 'post')

    expect(mocks.log).toHaveBeenCalledWith(
      '%cpre%cFIRST%cmid%o%cSECOND%cpost',
      'color:#00ff00',
      'color:#ff0000',
      'color:#00ff00',
      'color:#0000ff',
      'color:#00ff00',
      meta
    )
  })
})