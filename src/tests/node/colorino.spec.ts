import { test as base, describe, expect, vi } from 'vitest'
import util from 'node:util'
import { createColorino } from '../../node.js'
import { generateRandomString } from '../helpers/random.js'
import { createTestPalette } from '../helpers/test-setup.js'

interface ColorinoFixtures {
  stdoutSpy: {
    getOutput: () => string
  }
  stderrSpy: {
    getOutput: () => string
  }
  env: Record<string, string>
}

const test = base.extend<ColorinoFixtures>({
  // eslint-disable-next-line
  stdoutSpy: async ({}, use) => {
    const chunks: string[] = []

    const spies = [
      vi.spyOn(console, 'log').mockImplementation((...args) => {
        chunks.push(
          args
            .map(arg => (typeof arg === 'string' ? arg : util.inspect(arg)))
            .join(' ') + '\n'
        )
      }),
      vi.spyOn(console, 'info').mockImplementation((...args) => {
        chunks.push(
          args
            .map(arg => (typeof arg === 'string' ? arg : util.inspect(arg)))
            .join(' ') + '\n'
        )
      }),
      vi.spyOn(console, 'debug').mockImplementation((...args) => {
        chunks.push(
          args
            .map(arg => (typeof arg === 'string' ? arg : util.inspect(arg)))
            .join(' ') + '\n'
        )
      }),
    ]

    await use({
      getOutput: () => chunks.join(''),
    })

    spies.forEach(spy => spy.mockRestore())
  },

  // eslint-disable-next-line
  stderrSpy: async ({}, use) => {
    const chunks: string[] = []

    const spies = [
      vi.spyOn(console, 'warn').mockImplementation((...args) => {
        chunks.push(
          args
            .map(arg => (typeof arg === 'string' ? arg : util.inspect(arg)))
            .join(' ') + '\n'
        )
      }),
      vi.spyOn(console, 'error').mockImplementation((...args) => {
        chunks.push(
          args
            .map(arg => (typeof arg === 'string' ? arg : util.inspect(arg)))
            .join(' ') + '\n'
        )
      }),
      vi.spyOn(console, 'trace').mockImplementation((...args) => {
        chunks.push(
          'Trace: ' +
            args
              .map(arg => (typeof arg === 'string' ? arg : util.inspect(arg)))
              .join(' ') +
            '\n'
        )
      }),
    ]

    await use({
      getOutput: () => chunks.join(''),
    })

    spies.forEach(spy => spy.mockRestore())
  },

  env: [{}, { injected: true }],
})

// Apply env vars from fixture
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

      test('should output colored text', ({ stdoutSpy }) => {
        const testPalette = createTestPalette({ log: '#00ff00' })
        const logger = createColorino(testPalette, {
          disableWarnings: true,
        })

        logger.log('Hello, Colorino!')

        expect(stdoutSpy.getOutput()).toBe(
          '\u001B[38;5;46mHello, Colorino!\u001B[0m\n'
        )
      })
    })

    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('should output plain text', ({ stdoutSpy }) => {
        const testPalette = createTestPalette({ log: '#00ff00' })
        const logger = createColorino(testPalette, {
          disableWarnings: true,
        })

        logger.log('Hello, Colorino!')

        expect(stdoutSpy.getOutput()).toBe('Hello, Colorino!\n')
      })
    })
  })

  describe('Color Format Conversion (Integration Point)', () => {
    describe('with FORCE_COLOR=3', () => {
      test.scoped({ env: { FORCE_COLOR: '3' } })

      test('should use truecolor codes', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#ff5733' }), {
          disableWarnings: true,
        })

        logger.log('test')

        expect(stdoutSpy.getOutput()).toBe(
          '\u001B[38;2;255;87;51mtest\u001B[0m\n'
        )
      })
    })

    describe('with FORCE_COLOR=2', () => {
      test.scoped({ env: { FORCE_COLOR: '2' } })

      test('should use 256-color codes', ({ stdoutSpy }) => {
        const testPalette = createTestPalette({ log: '#00ff00' })
        const logger = createColorino(testPalette, {
          disableWarnings: true,
        })

        logger.log('test')

        expect(stdoutSpy.getOutput()).toBe('\u001B[38;5;46mtest\u001B[0m\n')
      })
    })

    describe('with FORCE_COLOR=1', () => {
      test.scoped({ env: { FORCE_COLOR: '1' } })

      test('should use basic ANSI codes', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), {
          disableWarnings: true,
        })

        logger.log('test')

        expect(stdoutSpy.getOutput()).toBe('\u001B[92mtest\u001B[0m\n')
      })
    })
  })

  describe('Multi-Argument Formatting', () => {
    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('should handle multiple arguments correctly', ({ stdoutSpy }) => {
        const logger = createColorino(createTestPalette(), {
          disableWarnings: true,
        })

        const loggedObject = { active: true }
        logger.log('Count:', 42, loggedObject)

        expect(stdoutSpy.getOutput()).toBe('Count: 42 {\n  "active": true\n}\n')
      })
    })
  })

  describe('Color Support Detection Warning', () => {
    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('should warn when no color support detected (by default)', ({
        stderrSpy,
      }) => {
        createColorino(createTestPalette())

        const stderr = stderrSpy.getOutput()
        expect(stderr).toContain('[Colorino]')
        expect(stderr).toContain('No ANSI color support detected')
      })
    })
  })

  describe('Edge Cases', () => {
    test('should throw an error for invalid palette entries at construction', () => {
      expect(() => {
        createColorino(createTestPalette({ log: 'not-a-valid-color' }))
      }).toThrow(/Invalid hex color/)
    })

    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('should handle arbitrary string inputs without crashing', ({
        stdoutSpy,
      }) => {
        const randomInput = generateRandomString(100)
        const logger = createColorino(createTestPalette(), {
          disableWarnings: true,
        })

        logger.log(randomInput)

        expect(stdoutSpy.getOutput()).toBe(`${randomInput}\n`)
      })
    })
  })

  describe('All Standard Log Levels', () => {
    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('should support all standard console methods', ({
        stdoutSpy,
        stderrSpy,
      }) => {
        const logger = createColorino(createTestPalette(), {
          disableWarnings: true,
        })

        logger.log('log')
        logger.info('info')
        logger.warn('warn')
        logger.error('error')
        logger.debug('debug')
        logger.trace('trace')

        const stdout = stdoutSpy.getOutput()
        const stderr = stderrSpy.getOutput()

        expect(stdout).toContain('log')
        expect(stdout).toContain('info')
        expect(stdout).toContain('debug')
        expect(stderr).toContain('warn')
        expect(stderr).toContain('error')
        expect(stderr).toContain('Trace: trace')
      })
    })
  })

  describe('Concurrent Logger Instances', () => {
    test('should not interfere with each other', ({ stdoutSpy }) => {
      vi.stubEnv('FORCE_COLOR', '1')
      const logger1 = createColorino(createTestPalette({ log: '#ff0000' }), {
        disableWarnings: true,
      })

      logger1.log('red')
      const firstOutput = stdoutSpy.getOutput()

      vi.stubEnv('FORCE_COLOR', '2')
      const logger2 = createColorino(createTestPalette({ log: '#00ff00' }), {
        disableWarnings: true,
      })

      logger2.log('green')
      const fullOutput = stdoutSpy.getOutput()
      const secondOutput = fullOutput.slice(firstOutput.length)

      expect(firstOutput).toContain('\u001B[91mred\u001B[0m\n')
      expect(secondOutput).toContain('\u001B[38;5;46mgreen\u001B[0m\n')

      vi.unstubAllEnvs()
    })
  })
})
