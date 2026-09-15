import { describe, expect, vi } from 'vitest'
import { from } from 'super-result'
import { createTestPalette } from '../helpers/palette.js'
import { createColorino } from '../../node.js'
import { generateRandomString } from '../helpers/random.js'
import { InputValidationError } from '../../errors.js'
import { test } from '../helpers/console-spy.js'

test.beforeEach(({ env }) => {
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value)
  }
})

test.afterEach(() => {
  vi.unstubAllEnvs()
})

const safeLog = (logger: ReturnType<typeof createColorino>, ...args: any[]) =>
  from(() => logger.log(...args))

describe('Colorino - Node Environment - Fuzz Test', () => {
  describe('Random String Inputs', () => {
    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('should handle 1000 random strings without crashing', () => {
        const logger = createColorino(createTestPalette(), {})

        const results = []
        for (let i = 0; i < 1000; i++) {
          const randomStr = generateRandomString(
            Math.floor(Math.random() * 100)
          )
          const result = safeLog(logger, randomStr)
          results.push(result)
        }

        const successCount = results.filter(r => r.ok).length
        expect(successCount).toBeGreaterThan(990)
      })

      test('should handle strings with special characters', () => {
        const logger = createColorino(createTestPalette(), {})

        const specialChars = [
          '\n\r\t',
          '\x00\x01\x02',
          '\\n\\r\\t',
          '"""\'\'\'',
          '<script>alert("xss")</script>',
          '../../etc/passwd',
          'null\0byte',
          '🎨🚀💥🔥',
          '中文字符',
          'العربية',
          '🏳️‍🌈',
        ]

        for (const str of specialChars) {
          const result = safeLog(logger, str)
          expect(result.ok).toBe(true)
        }
      })

      test('should handle extremely long strings', () => {
        const logger = createColorino(createTestPalette(), {})

        const sizes = [1000, 10000, 100000]

        for (const size of sizes) {
          const longString = 'x'.repeat(size)
          const result = safeLog(logger, longString)
          expect(result.ok).toBe(true)
        }
      })
    })
  })

  describe('Random Object Inputs', () => {
    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('should handle circular references gracefully', () => {
        const logger = createColorino(createTestPalette(), {})

        const circular1: any = { name: 'root', self: null }
        circular1.self = circular1
        const circular2: any = { a: { b: null } }
        circular2.a.b = circular2
        const circular3: any = []
        circular3.push(circular3)

        for (const obj of [circular1, circular2, circular3]) {
          const result = safeLog(logger, obj)
          expect(result.ok).toBe(true)
        }
      })

      test('should handle objects with unusual properties', () => {
        const logger = createColorino(createTestPalette(), {})

        const weirdObjects = [
          { [Symbol('key')]: 'value' },
          { __proto__: { injected: true } },
          Object.create(null),
          new Date(),
          /regex/gi,
          new Error('error object'),
          new Map([['key', 'value']]),
          new Set([1, 2, 3]),
          Buffer.from('buffer'),
          { toJSON: () => ({ custom: true }) },
        ]

        for (const obj of weirdObjects) {
          const result = safeLog(logger, obj)
          expect(result.ok).toBe(true)
        }
      })

      test('should handle deeply nested objects', () => {
        const logger = createColorino(createTestPalette(), {})

        let deep: any = { value: 'bottom' }
        for (let i = 0; i < 100; i++) {
          deep = { level: i, child: deep }
        }

        const result = safeLog(logger, deep)
        expect(result.ok).toBe(true)
      })

      test('should handle large arrays with mixed types', () => {
        const logger = createColorino(createTestPalette(), {})

        const largeArray = Array.from({ length: 1000 }, (_, i) => {
          const types = [
            i,
            `string-${i}`,
            { index: i },
            null,
            undefined,
            true,
            false,
            [i, i * 2],
          ]
          return types[i % types.length]
        })

        const result = safeLog(logger, largeArray)
        expect(result.ok).toBe(true)
      })
    })
  })

  describe('Random Color Codes', () => {
    test('should handle invalid hex colors', () => {
      const result = from(() =>
        createColorino(createTestPalette({ log: '#gggggg' }))
      )

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InputValidationError)
      }
    })

    describe('with FORCE_COLOR=2', () => {
      test.scoped({ env: { FORCE_COLOR: '2' } })

      test('should handle 1000 random hex colors', ({ stdoutSpy }) => {
        let previousLength = 0
        for (let i = 0; i < 1000; i++) {
          const hex = `#${Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, '0')}`

          const logger = createColorino(createTestPalette({ log: hex }), {})

          const result = safeLog(logger, 'test')
          expect(result.ok).toBe(true)

          const currentOutput = stdoutSpy.getOutput()
          expect(currentOutput.length).toBeGreaterThan(previousLength)
          previousLength = currentOutput.length
        }
      })
    })
  })

  describe('Random Environment Configurations', () => {
    test('should handle random environment variable combinations', () => {
      const envVars = [
        'NO_COLOR',
        'FORCE_COLOR',
        'TERM',
        'COLORTERM',
        'WT_SESSION',
      ]
      const values = ['', '0', '1', 'true', 'false', 'xterm', 'dumb']

      for (let i = 0; i < 100; i++) {
        for (const key of envVars) {
          const value = values[Math.floor(Math.random() * values.length)]
          vi.stubEnv(key, value)
        }

        const logger = createColorino(createTestPalette(), {})

        const result = safeLog(logger, 'test')
        expect(result.ok).toBe(true)

        vi.unstubAllEnvs()
      }
    })
  })

  describe('Concurrent Operations', () => {
    describe('with NO_COLOR=1', () => {
      test.scoped({ env: { NO_COLOR: '1' } })

      test('should handle rapid sequential logs', () => {
        const logger = createColorino(createTestPalette(), {})

        const results = []
        for (let i = 0; i < 1000; i++) {
          const result = safeLog(logger, `Message ${i}`)
          results.push(result)
        }

        const allSuccessful = results.every(r => r.ok)
        expect(allSuccessful).toBe(true)
      })
    })

    describe('with FORCE_COLOR=1', () => {
      test.scoped({ env: { FORCE_COLOR: '1' } })

      test('should handle interleaved log levels', () => {
        const logger = createColorino(createTestPalette(), {})

        const results = []
        for (let i = 0; i < 250; i++) {
          results.push(safeLog(logger, `log ${i}`))
          results.push(from(() => logger.info(`info ${i}`)))
          results.push(from(() => logger.warn(`warn ${i}`)))
          results.push(from(() => logger.error(`error ${i}`)))
        }

        const allSuccessful = results.every(r => r.ok)
        expect(allSuccessful).toBe(true)
      })
    })
  })
})
