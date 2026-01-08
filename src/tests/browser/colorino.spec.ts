import { describe, expect, vi, test as baseTest } from 'vitest'
import { createColorino } from '../../browser.js'
import { createTestPalette } from '../helpers/palette.js'

type ConsoleSpies = {
  log: ReturnType<typeof vi.spyOn>
  warn: ReturnType<typeof vi.spyOn>
  error: ReturnType<typeof vi.spyOn>
  info: ReturnType<typeof vi.spyOn>
  debug: ReturnType<typeof vi.spyOn>
  trace: ReturnType<typeof vi.spyOn>
}

interface BrowserColorinoFixtures {
  mocks: ConsoleSpies
}

const test = baseTest.extend<BrowserColorinoFixtures>({
  // eslint-disable-next-line
  mocks: async ({}, use) => {
    const mocks: ConsoleSpies = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      trace: vi.spyOn(console, 'trace').mockImplementation(() => {}),
    }

    await use(mocks)

    vi.restoreAllMocks()
  },
})

describe('Colorino - Real Browser - Unit Test', () => {
  test('does not emit color support warnings in browsers', ({ mocks }) => {
    createColorino(createTestPalette())
    expect(mocks.warn).not.toHaveBeenCalled()
  })

  test('applies palette color to a single string', ({ mocks }) => {
    const logger = createColorino(createTestPalette({ log: '#00ff00' }))
    logger.log('Browser console test')

    expect(mocks.log).toHaveBeenCalledWith(
      '%cBrowser console test',
      'color:#00ff00'
    )
  })

  test('applies palette color and keeps objects expandable', ({ mocks }) => {
    const logger = createColorino(createTestPalette({ log: '#ffffff' }))
    const testObject = { browser: true, id: 123 }

    logger.log('Object data:', testObject)

    expect(mocks.log).toHaveBeenCalledWith(
      '%cObject data:%o',
      'color:#ffffff',
      testObject
    )
  })

  test('supports all console levels without throwing', ({ mocks }) => {
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

  test('allows per-call color override via colorize()', ({ mocks }) => {
    const logger = createColorino(createTestPalette({ log: '#ffffff' }))

    const override = logger.colorize('OVERRIDE', '#ff5733')

    logger.log(override, 'normal')

    expect(mocks.log).toHaveBeenCalledWith(
      '%cOVERRIDE%cnormal',
      'color:#ff5733',
      'color:#ffffff'
    )
  })

  test('does not persist manual colorize() overrides across calls', ({
    mocks,
  }) => {
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

  test('combines overrides, palette strings and objects in order', ({
    mocks,
  }) => {
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
      meta,
      'color:#0000ff',
      'color:#00ff00'
    )
  })

  test('styles trace() messages with palette color', ({ mocks }) => {
    const logger = createColorino(createTestPalette({ trace: '#ff00ff' }))
    const meta = { from: 'trace' }

    logger.trace('Trace message', meta)

    expect(mocks.trace).toHaveBeenCalledWith(
      '%cTrace message%o',
      'color:#ff00ff',
      meta
    )
  })

  test('combines css(), colorize(), palette strings and objects in order', ({
    mocks,
  }) => {
    const logger = createColorino(createTestPalette({ log: '#00ff00' }))

    const cssStyled = logger.css('CSS', { color: 'orange' })
    const override = logger.colorize('OVR', '#ff0000')
    const meta = { id: 42 }

    logger.log('pre', cssStyled, 'mid', meta, override, 'post')

    expect(mocks.log).toHaveBeenCalledWith(
      '%cpre%cCSS%cmid%o%cOVR%cpost',
      'color:#00ff00',
      'color:orange',
      'color:#00ff00',
      meta,
      'color:#ff0000',
      'color:#00ff00'
    )
  })

  test('accepts raw CSS strings in css() helper', ({ mocks }) => {
    const logger = createColorino(createTestPalette({ log: '#00ff00' }))

    const styled = logger.css('Raw', 'color:blue; text-decoration:underline;')

    logger.log(styled, 'plain')

    expect(mocks.log).toHaveBeenCalledWith(
      '%cRaw%cplain',
      'color:blue; text-decoration:underline;',
      'color:#00ff00'
    )
  })

  test('builds CSS strings from css() object style', ({ mocks }) => {
    const logger = createColorino(createTestPalette({ log: '#00ff00' }))

    const styled = logger.css('Styled', {
      color: 'red',
      'background-color': 'black',
      'font-weight': 'bold',
    })

    logger.log(styled)

    expect(mocks.log).toHaveBeenCalledWith(
      '%cStyled',
      'color:red;background-color:black;font-weight:bold'
    )
  })

  test('applies CSS gradient with background-clip', ({ mocks }) => {
    const logger = createColorino(createTestPalette())

    const gradient = logger.gradient('GRADIENT', '#ff0000', '#0000ff')
    logger.log(gradient)

    const call = mocks.log.mock.calls[0]
    expect(call[0]).toContain('%c')
    expect(call[0]).toContain('GRADIENT')
    expect(call[1]).toContain('background: linear-gradient')
    expect(call[1]).toContain('#ff0000')
    expect(call[1]).toContain('#0000ff')
    expect(call[1]).toContain('background-clip: text')
    expect(call[1]).toContain('-webkit-background-clip: text')
  })

  test('combines gradient with plain text', ({ mocks }) => {
    const logger = createColorino(createTestPalette({ log: '#ffffff' }))

    const gradient = logger.gradient('GRAD', '#ff0000', '#0000ff')
    logger.log('Before', gradient, 'After')

    const call = mocks.log.mock.calls[0]
    expect(call[0]).toBe('%cBefore%cGRAD%cAfter')
    expect(call[1]).toBe('color:#ffffff')
    expect(call[2]).toContain('background: linear-gradient')
    expect(call[3]).toBe('color:#ffffff')
  })

  test('combines gradient with colorize', ({ mocks }) => {
    const logger = createColorino(createTestPalette({ log: '#ffffff' }))

    const gradient = logger.gradient('GRAD', '#ff0000', '#0000ff')
    const colored = logger.colorize('COLOR', '#00ff00')
    logger.log(gradient, colored)

    const call = mocks.log.mock.calls[0]
    expect(call[0]).toContain('GRAD')
    expect(call[0]).toContain('COLOR')
  })

  test('combines gradient with css', ({ mocks }) => {
    const logger = createColorino(createTestPalette({ log: '#ffffff' }))

    const gradient = logger.gradient('GRAD', '#ff0000', '#0000ff')
    const cssStyled = logger.css('CSS', { color: 'orange' })
    logger.log(gradient, cssStyled)

    const call = mocks.log.mock.calls[0]
    expect(call[0]).toContain('GRAD')
    expect(call[0]).toContain('CSS')
  })

  // eslint-disable-next-line
  test('returns plain text when NO_COLOR is simulated', ({}) => {
    const logger = createColorino(createTestPalette())

    const gradient = logger.gradient('TEST', '#ff0000', '#0000ff')

    expect(gradient).toBeDefined()
    expect(() => logger.log(gradient)).not.toThrow()
  })
})
