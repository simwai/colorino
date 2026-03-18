import { describe, expect, vi } from 'vitest'
import { createColorino } from '../../node.js'
import { generateRandomString } from '../helpers/random.js'
import { createTestPalette } from '../helpers/palette.js'
import { test } from '../helpers/console-spy.js'
import { ANSI } from '../helpers/ansi-codes.js'

test.beforeEach(({ env }) => {
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value)
  }
})

test.afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Colorino - Node Environment - Unit Test', () => {
  describe('Basic Logging Workflow (Critical Path)', () => {
    describe('with FORCE_COLOR=2', () => {
      test.scoped({ env: { FORCE_COLOR: '2' } })

      test('outputs 256-color codes for green text', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), { metadata: { callSite: { isEnabled: false } } })

        logger.log('Hello, Colorino!')

        expect(stdoutSpy.getOutput()).toBe(
          `${ANSI.GREEN_256}Hello, Colorino!${ANSI.RESET}\n`
        )
      })
    })

    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('outputs plain text without color codes', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#ff5733' }), { metadata: { callSite: { isEnabled: false } } })

        logger.log('Hello, Colorino!')

        expect(stdoutSpy.getOutput()).toBe('Hello, Colorino!\n')
      })
    })
  })

  describe('Color Format Conversion (Integration Point)', () => {
    describe('with FORCE_COLOR=3', () => {
      test.scoped({ env: { FORCE_COLOR: '3' } })

      test('supports 24-bit RGB (truecolor) output', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#ff5733' }), { metadata: { callSite: { isEnabled: false } } })

        logger.log('Truecolor test')

        expect(stdoutSpy.getOutput()).toBe(
          `${ANSI.ORANGE_TRUE}Truecolor test${ANSI.RESET}\n`
        )
      })
    })

    describe('with FORCE_COLOR=2', () => {
      test.scoped({ env: { FORCE_COLOR: '2' } })

      test('downscales hex to 256 colors', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), { metadata: { callSite: { isEnabled: false } } })

        logger.log('256-color test')

        expect(stdoutSpy.getOutput()).toBe(
          `${ANSI.GREEN_256}256-color test${ANSI.RESET}\n`
        )
      })
    })

    describe('with FORCE_COLOR=1', () => {
      test.scoped({ env: { FORCE_COLOR: '1' } })

      test('downscales hex to basic 16 colors', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), { metadata: { callSite: { isEnabled: false } } })

        logger.log('Basic-color test')

        expect(stdoutSpy.getOutput()).toBe(
          `${ANSI.GREEN_BASIC}Basic-color test${ANSI.RESET}\n`
        )
      })
    })
  })

  describe('Edge Cases', () => {
    describe('Invalid Input', () => {
      test('throws error for malformed hex color', () => {
        expect(() =>
          createColorino(createTestPalette({ log: 'not-a-valid-color' }), { metadata: { callSite: { isEnabled: false } } })
        ).toThrow()
      })
    })

    describe('Empty Arguments', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('handles logging with no arguments', ({ stdoutSpy }) => {
        const logger1 = createColorino(
          createTestPalette({ log: '#ffffff' }),
          { metadata: { callSite: { isEnabled: false } } }
        )
        logger1.log()
        expect(stdoutSpy.getOutput()).toBe('\n')

        const logger2 = createColorino(
          createTestPalette({ log: '#ffffff' }),
          { metadata: { callSite: { isEnabled: false } } }
        )
        logger2.log('')
        expect(stdoutSpy.getOutput()).toBe('\n\n')
      })
    })

    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('handles arbitrary random strings without crashing', ({
        stdoutSpy,
      }) => {
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), { metadata: { callSite: { isEnabled: false } } })
        const randomInput = generateRandomString(100)

        logger.log(randomInput)

        expect(stdoutSpy.getOutput()).toBe(`${randomInput}\n`)
      })
    })
  })

  describe('Object and Error Formatting with Newlines', () => {
    describe('with FORCE_COLOR=2', () => {
      test.scoped({ env: { FORCE_COLOR: '2' } })

      test('adds newline before first object argument', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), { metadata: { callSite: { isEnabled: false } } })
        const data = { id: 1, name: 'test' }

        logger.log(data)

        expect(stdoutSpy.getOutput()).toBe(
          `\n${JSON.stringify(data, null, 2)}\n`
        )
      })

      test('adds newline before first Error argument', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#ffffff' }), { metadata: { callSite: { isEnabled: false } } })
        const error = new Error('Test error')

        logger.log(error)

        const output = stdoutSpy.getOutput()
        expect(output.startsWith('\n')).toBe(true)
        expect(output).toContain('Error: Test error')
      })
    })

    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('handles consecutive strings without extra newlines', ({
        stdoutSpy,
      }) => {
        const logger = createColorino(createTestPalette({ log: '#ffffff' }), { metadata: { callSite: { isEnabled: false } } })

        logger.log('First', 'Second', 'Third')

        expect(stdoutSpy.getOutput()).toBe('First Second Third\n')
      })

      test('adds newline before object when preceded by string', ({
        stdoutSpy,
      }) => {
        const logger = createColorino(createTestPalette({ log: '#ffffff' }), { metadata: { callSite: { isEnabled: false } } })
        const data = { id: 1 }

        logger.log('Data:', data)

        expect(stdoutSpy.getOutput()).toBe(`Data: \n${JSON.stringify(data, null, 2)}\n`)
      })

      test('adds newline before string after Error', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#ffffff' }), { metadata: { callSite: { isEnabled: false } } })
        const error = new Error('Test error')

        logger.log(error, 'Follow-up')

        const output = stdoutSpy.getOutput()
        expect(output).toContain('Error: Test error')
        expect(output).toContain('\nFollow-up')
      })

      test('adds newline before string after object', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#ffffff' }), { metadata: { callSite: { isEnabled: false } } })
        const data = { id: 1 }

        logger.log(data, 'Follow-up')

        expect(stdoutSpy.getOutput()).toBe(
          `\n${JSON.stringify(data, null, 2)} \nFollow-up\n`
        )
      })

      test('does not add double newlines between objects', ({ stdoutSpy }) => {
        const logger = createColorino(
          createTestPalette({ log: '#ffffff' }),
          { metadata: { callSite: { isEnabled: false } } }
        )
        const obj1 = { a: 1 }
        const obj2 = { b: 2 }

        logger.log(obj1, obj2)

        const output = stdoutSpy.getOutput()
        const expected = `\n${JSON.stringify(obj1, null, 2)} \n${JSON.stringify(obj2, null, 2)}\n`
        expect(output).toBe(expected)
      })

      test('formats deep circular objects correctly', ({ stdoutSpy }) => {
        const logger = createColorino(
          createTestPalette({ log: '#ffffff' }),
          { metadata: { callSite: { isEnabled: false } } }
        )
        const circular: any = { name: 'test' }
        circular.self = circular

        logger.log(circular)

        expect(stdoutSpy.getOutput()).toContain('[Circular]')
      })
    })

    describe('with FORCE_COLOR=2', () => {
      test.scoped({ env: { FORCE_COLOR: '2' } })

      test('colorizes all string arguments with the palette color', ({
        stdoutSpy,
      }) => {
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), { metadata: { callSite: { isEnabled: false } } })

        logger.log('First', 'Second', 'Third')

        const output = stdoutSpy.getOutput()

        expect(output).toBe(
          `${ANSI.GREEN_256}First${ANSI.RESET} ` +
            `${ANSI.GREEN_256}Second${ANSI.RESET} ` +
            `${ANSI.GREEN_256}Third${ANSI.RESET}\n`
        )
      })
    })
  })

  describe('Colorize Helper', () => {
    describe('with FORCE_COLOR=3', () => {
      test.scoped({ env: { FORCE_COLOR: '3' } })

      test('wraps text in 24-bit truecolor codes', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette(), { metadata: { callSite: { isEnabled: false } } })
        const colored = logger.colorize('OVERRIDE', '#ff5733')

        logger.log(colored)

        expect(stdoutSpy.getOutput()).toBe(
          `${ANSI.ORANGE_TRUE}OVERRIDE${ANSI.RESET}\n`
        )
      })
    })

    describe('with FORCE_COLOR=2', () => {
      test.scoped({ env: { FORCE_COLOR: '2' } })

      test('wraps text in 256-color codes', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette(), { metadata: { callSite: { isEnabled: false } } })
        const colored = logger.colorize('OVERRIDE', '#00ff00')

        logger.log(colored)

        expect(stdoutSpy.getOutput()).toBe(
          `${ANSI.GREEN_256}OVERRIDE${ANSI.RESET}\n`
        )
      })
    })

    describe('with FORCE_COLOR=1', () => {
      test.scoped({ env: { FORCE_COLOR: '1' } })

      test('wraps text in basic 16-color ANSI codes', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette(), { metadata: { callSite: { isEnabled: false } } })
        const colored = logger.colorize('OVERRIDE', '#00ff00')

        logger.log(colored)

        expect(stdoutSpy.getOutput()).toBe(
          `${ANSI.GREEN_BASIC}OVERRIDE${ANSI.RESET}\n`
        )
      })
    })

    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('returns plain text without color codes', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#ffffff' }), { metadata: { callSite: { isEnabled: false } } })
        const colored = logger.colorize('OVERRIDE', '#00ff00')

        logger.log(colored)

        expect(stdoutSpy.getOutput()).toBe('OVERRIDE\n')
      })
    })
  })

  describe('Gradient Helper', () => {
    describe('with FORCE_COLOR=3', () => {
      test.scoped({ env: { FORCE_COLOR: '3' } })

      test('applies a truecolor gradient to a string', ({ stdoutSpy }) => {
        const logger = createColorino(
          createTestPalette({ log: '#ffffff' }),
          { metadata: { callSite: { isEnabled: false } } }
        )
        const text = 'GRADIENT'
        const gradient = logger.gradient(text, '#ff0000', '#0000ff')

        logger.log(gradient)

        const output = stdoutSpy.getOutput()

        expect(output).toContain('\x1b[38;2;255;0;0mG')
        expect(output).toContain('\x1b[38;2;0;0;255mT')
        expect(output.endsWith('\x1b[0m\n')).toBe(true)
      })
    })

    describe('with FORCE_COLOR=2', () => {
      test.scoped({ env: { FORCE_COLOR: '2' } })

      test('applies a 256-color gradient to a string', ({ stdoutSpy }) => {
        const logger = createColorino(
          createTestPalette({ log: '#ffffff' }),
          { metadata: { callSite: { isEnabled: false } } }
        )
        const text = 'GRADIENT'
        const gradient = logger.gradient(text, '#ff0000', '#0000ff')

        logger.log(gradient)

        const output = stdoutSpy.getOutput()

        expect(output).toContain('\x1b[38;5;196mG')
        expect(output).toContain('\x1b[38;5;21mT')
        expect(output.endsWith('\x1b[0m\n')).toBe(true)
      })
    })

    describe('with FORCE_COLOR=1', () => {
      test.scoped({ env: { FORCE_COLOR: '1' } })

      test('returns plain text (not supported in basic ANSI)', ({ stdoutSpy }) => {
        const logger = createColorino(
          createTestPalette({ log: '#ffffff' }),
          { metadata: { callSite: { isEnabled: false } } }
        )
        const text = 'GRADIENT'
        const gradient = logger.gradient(text, '#ff0000', '#0000ff')

        logger.log(gradient)

        expect(stdoutSpy.getOutput()).toBe('\x1b[97mGRADIENT\x1b[0m\n')
      })
    })

    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('returns plain text without color codes', ({ stdoutSpy }) => {
        const logger = createColorino(
          createTestPalette({ log: '#ffffff' }),
          { metadata: { callSite: { isEnabled: false } } }
        )
        const text = 'GRADIENT'
        const gradient = logger.gradient(text, '#ff0000', '#0000ff')

        logger.log(gradient)

        const output = stdoutSpy.getOutput()
        expect(output).toBe('GRADIENT\n')
      })
    })
  })
})
