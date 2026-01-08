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
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), {})

        logger.log('Hello, Colorino!')

        expect(stdoutSpy.getOutput()).toBe(
          `${ANSI.GREEN_256}Hello, Colorino!${ANSI.RESET}\n`
        )
      })
    })

    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('outputs plain text without color codes', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#ff5733' }), {})

        logger.log('Hello, Colorino!')

        expect(stdoutSpy.getOutput()).toBe('Hello, Colorino!\n')
      })
    })
  })

  describe('Color Format Conversion (Integration Point)', () => {
    describe('with FORCE_COLOR=3', () => {
      test.scoped({ env: { FORCE_COLOR: '3' } })

      test('uses 24-bit truecolor codes', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#ff5733' }), {})

        logger.log('test')

        expect(stdoutSpy.getOutput()).toBe(
          `${ANSI.ORANGE_TRUE}test${ANSI.RESET}\n`
        )
      })
    })

    describe('with FORCE_COLOR=2', () => {
      test.scoped({ env: { FORCE_COLOR: '2' } })

      test('uses 256-color codes', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), {})

        logger.log('test')

        expect(stdoutSpy.getOutput()).toBe(
          `${ANSI.GREEN_256}test${ANSI.RESET}\n`
        )
      })
    })

    describe('with FORCE_COLOR=1', () => {
      test.scoped({ env: { FORCE_COLOR: '1' } })

      test('uses basic 16-color ANSI codes', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), {})

        logger.log('test')

        expect(stdoutSpy.getOutput()).toBe(
          `${ANSI.GREEN_BASIC}test${ANSI.RESET}\n`
        )
      })
    })
  })

  describe('Multi-Argument Formatting', () => {
    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('concatenates multiple arguments with proper spacing', ({
        stdoutSpy,
        logger,
      }) => {
        const loggedObject = { active: true }
        logger.log('Count:', 42, loggedObject)

        const output = stdoutSpy.getOutput()
        expect(output).toContain('Count: 42')
        expect(output).toContain('"active": true')
      })
    })
  })

  describe('Error and trace logging with cleaned stack', () => {
    test('removes Colorino internals from error stack traces', ({
      stderrSpy,
      logger,
    }) => {
      const error = new Error('Test error')

      logger.error('Failed:', error)

      const output = stderrSpy.getOutput()

      expect(output, 'Should contain error message').toContain('Failed:')
      expect(output, 'Should contain error type').toContain('Error: Test error')
      expect(output, 'Should contain valid stack frame').toMatch(/^\s*at\s.+/m)

      // Should not contain internal implementation details
      expect(output, 'Should not leak MyColorino._out').not.toMatch(
        /MyColorino\._out/
      )
      expect(output, 'Should not leak _printCleanTrace').not.toMatch(
        /MyColorino\._printCleanTrace/
      )
      expect(output, 'Should not leak _cleanErrorStack').not.toMatch(
        /MyColorino\._cleanErrorStack/
      )
      expect(output, 'Should not leak dist path').not.toMatch(
        /\/colorino\/dist\//
      )
      expect(output, 'Should not leak compiled filenames').not.toMatch(
        /colorino\.[A-Za-z0-9]+\.mjs/
      )
    })

    test('removes Colorino internals from trace() stack traces', ({
      stdoutSpy,
      logger,
    }) => {
      logger.trace('Trace')

      const output = stdoutSpy.getOutput()
      expect(output, 'Should contain trace label').toContain('Trace')
      expect(output, 'Should contain valid stack frame').toMatch(/^\s*at\s.+/m)
      expect(output, 'Should not leak MyColorino._out').not.toMatch(
        /MyColorino\._out/
      )
      expect(output, 'Should not leak compiled filenames').not.toMatch(
        /colorino\.[A-Za-z0-9]+\.mjs/
      )
    })
  })

  describe('Edge Cases', () => {
    test('throws an error for invalid hex colors at construction', () => {
      expect(() => {
        createColorino(createTestPalette({ log: 'not-a-valid-color' }))
      }).toThrow(/Invalid hex color/)
    })

    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('handles arbitrary random strings without crashing', ({
        stdoutSpy,
        logger,
      }) => {
        const randomInput = generateRandomString(100)

        logger.log(randomInput)

        expect(stdoutSpy.getOutput()).toBe(`${randomInput}\n`)
      })
    })
  })

  describe('All Standard Log Levels', () => {
    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('routes log/info/debug to stdout and warn/error to stderr', ({
        stdoutSpy,
        stderrSpy,
        logger,
      }) => {
        logger.log('log')
        logger.info('info')
        logger.warn('warn')
        logger.error('error')
        logger.debug('debug')
        logger.trace('trace')

        const stdout = stdoutSpy.getOutput()
        const stderr = stderrSpy.getOutput()

        expect(stdout, 'log() should write to stdout').toContain('log')
        expect(stdout, 'info() should write to stdout').toContain('info')
        expect(stdout, 'debug() should write to stdout').toContain('debug')
        expect(stdout, 'trace() should write to stdout').toContain('trace')

        expect(stderr, 'warn() should write to stderr').toContain('warn')
        expect(stderr, 'error() should write to stderr').toContain('error')
      })
    })
  })

  describe('Concurrent Logger Instances', () => {
    describe('with FORCE_COLOR=1', () => {
      test.scoped({ env: { FORCE_COLOR: '1' } })

      test('first logger outputs basic red color', ({ stdoutSpy }) => {
        const logger1 = createColorino(
          createTestPalette({ log: '#ff0000' }),
          {}
        )

        logger1.log('red')

        expect(stdoutSpy.getOutput()).toContain(
          `${ANSI.RED_BASIC}red${ANSI.RESET}`
        )
      })
    })

    describe('with FORCE_COLOR=2', () => {
      test.scoped({ env: { FORCE_COLOR: '2' } })

      test('second logger outputs 256-color green', ({ stdoutSpy }) => {
        const logger2 = createColorino(
          createTestPalette({ log: '#00ff00' }),
          {}
        )

        logger2.log('green')

        expect(stdoutSpy.getOutput()).toContain(
          `${ANSI.GREEN_256}green${ANSI.RESET}`
        )
      })
    })
  })

  describe('Object and Error Formatting with Newlines', () => {
    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('adds leading newline before objects', ({ stdoutSpy, logger }) => {
        const obj = { id: 1, active: true }
        logger.log('Data:', obj)

        const output = stdoutSpy.getOutput()
        expect(output).toContain('Data:')
        expect(output).toContain('"id": 1')
        expect(output).toContain('"active": true')
      })

      test('adds newline before string after object', ({
        stdoutSpy,
        logger,
      }) => {
        const obj = { id: 1 }
        logger.log('Start', obj, 'End')

        const output = stdoutSpy.getOutput()
        expect(output).toContain('Start')
        expect(output).toContain('"id": 1')
        expect(output).toContain('End')
        expect(output).toMatch(/Start[\s\S]*"id": 1[\s\S]*End/)
      })

      test('handles consecutive strings without extra newlines', ({
        stdoutSpy,
        logger,
      }) => {
        logger.log('First', 'Second', 'Third')

        expect(stdoutSpy.getOutput()).toBe('First Second Third\n')
      })

      test('handles complex mixed sequences correctly', ({
        stdoutSpy,
        logger,
      }) => {
        const obj1 = { a: 1 }
        const obj2 = { b: 2 }
        const obj3 = { c: 3 }
        logger.log('A', obj1, obj2, 'B', obj3, 'C', 'D', obj3)

        const output = stdoutSpy.getOutput()
        expect(output).toContain('A')
        expect(output).toContain('"a": 1')
        expect(output).toContain('"b": 2')
        expect(output).toContain('B')
        expect(output).toContain('"c": 3')
        expect(output).toContain('C D')
      })

      test('adds leading newline before Error objects', ({
        stderrSpy,
        logger,
      }) => {
        const error = new Error('Test error')
        logger.error('Failed:', error)

        const output = stderrSpy.getOutput()
        expect(output).toContain('Failed:')
        expect(output).toContain('\n')
        expect(output).toContain('Error: Test error')
      })

      test('adds newline before string after Error', ({
        stderrSpy,
        logger,
      }) => {
        const error = new Error('Test error')
        logger.error('Failed:', error, 'Retrying...')

        const output = stderrSpy.getOutput()
        expect(output).toContain('Failed:')
        expect(output).toContain('Error: Test error')
        expect(output).toMatch(/Error: Test error[\s\S]*Retrying/)
      })

      test('truncates objects at max depth with [Object] placeholder', ({
        stdoutSpy,
        logger,
      }) => {
        const deepObj = {
          l1: { l2: { l3: { l4: { l5: { l6: 'too deep' } } } } },
        }
        logger.log(deepObj)

        const output = stdoutSpy.getOutput()
        expect(output, 'Should truncate deep objects').toContain('[Object]')
        expect(output, 'Should not leak deeply nested values').not.toContain(
          'too deep'
        )
      })

      test('handles circular references with [Circular] placeholder', ({
        stdoutSpy,
        logger,
      }) => {
        const circular: any = { name: 'test' }
        circular.self = circular

        logger.log(circular)

        const output = stdoutSpy.getOutput()
        expect(output, 'Should detect circular references').toContain(
          '[Circular]'
        )
      })
    })

    describe('with FORCE_COLOR=2', () => {
      test.scoped({ env: { FORCE_COLOR: '2' } })

      test('colorizes string arguments when followed by objects', ({
        stdoutSpy,
      }) => {
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), {})

        const obj = { id: 1 }
        logger.log('Status:', obj)

        const output = stdoutSpy.getOutput()
        expect(output).toContain(`${ANSI.GREEN_256}Status:${ANSI.RESET}`)
        expect(output).toContain('"id": 1')
      })

      test('colorizes all string arguments with the palette color', ({
        stdoutSpy,
      }) => {
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), {})

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
        const logger = createColorino(createTestPalette({ log: '#ffffff' }), {})

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
        const logger = createColorino(createTestPalette({ log: '#ffffff' }), {})

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
        const logger = createColorino(createTestPalette({ log: '#ffffff' }), {})

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
        const logger = createColorino(createTestPalette({ log: '#ffffff' }), {})

        const colored = logger.colorize('OVERRIDE', '#ff0000')

        logger.log(colored)

        expect(stdoutSpy.getOutput()).toBe('OVERRIDE\n')
      })
    })

    describe('Manual overrides with colorize', () => {
      describe('with FORCE_COLOR=2', () => {
        test.scoped({ env: { FORCE_COLOR: '2' } })

        test('allows mixing manual override (first arg) with themed text', ({
          stdoutSpy,
        }) => {
          const logger = createColorino(
            createTestPalette({ log: '#ffffff' }),
            {}
          )

          const override = logger.colorize('OVERRIDE', '#00ff00')

          logger.log(override, 'normal')

          const output = stdoutSpy.getOutput()

          expect(output).toContain(`${ANSI.GREEN_256}OVERRIDE${ANSI.RESET}`)
          expect(output).toMatch(/.*OVERRIDE.*normal.*\n$/)
        })

        test('allows mixing manual override (second arg) with themed text', ({
          stdoutSpy,
        }) => {
          const logger = createColorino(
            createTestPalette({ log: '#ffffff' }),
            {}
          )

          const override = logger.colorize('OVERRIDE', '#00ff00')

          logger.log('normal', override)

          const output = stdoutSpy.getOutput()

          expect(output).toContain(`${ANSI.GREEN_256}OVERRIDE${ANSI.RESET}`)
          expect(output).toMatch(/.*normal.*OVERRIDE.*\n$/)
        })
      })
    })
  })
})
