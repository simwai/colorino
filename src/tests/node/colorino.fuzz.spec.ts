import { describe, it, expect } from 'vitest'
import { withEnv, envPresets } from '../helpers/env-helpers.js'
import { captureOutputAndError } from '../helpers/console-capture.js'
import { createTestPalette } from '../helpers/test-setup.js'
import { createColorino } from '../../node.js'
import { generateRandomString } from '../helpers/random.js'
import { ColorinoError } from '../../errors.js'

describe('Colorino - Node Environment - Fuzz Test', () => {
  describe('Random String Inputs', () => {
    it('should handle 1000 random strings without crashing', async () => {
      const logger = withEnv(envPresets.NO_COLOR, () =>
        createColorino(createTestPalette(), { disableWarnings: true })
      )
      let successCount = 0

      for (let i = 0; i < 1000; i++) {
        const randomStr = generateRandomString(Math.floor(Math.random() * 100))
        const result = await captureOutputAndError(() => logger.log(randomStr))
        if (!result.error) successCount++
      }
      expect(successCount).toBeGreaterThan(990)
    })

    it('should handle strings with special characters', async () => {
      const logger = withEnv(envPresets.NO_COLOR, () =>
        createColorino(createTestPalette(), { disableWarnings: true })
      )
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
        const result = await captureOutputAndError(() => logger.log(str))
        expect(result.error).toBeUndefined()
      }
    })

    it('should handle extremely long strings', async () => {
      const logger = withEnv(envPresets.NO_COLOR, () =>
        createColorino(createTestPalette(), { disableWarnings: true })
      )
      const sizes = [1000, 10000, 100000]

      for (const size of sizes) {
        const longString = 'x'.repeat(size)
        const result = await captureOutputAndError(() => logger.log(longString))
        expect(result.error).toBeUndefined()
      }
    })
  })

  describe('Random Object Inputs', () => {
    it('should handle circular references gracefully', async () => {
      const logger = withEnv(envPresets.NO_COLOR, () =>
        createColorino(createTestPalette(), { disableWarnings: true })
      )
      const circular1: any = { name: 'root', self: null }
      circular1.self = circular1
      const circular2: any = { a: { b: null } }
      circular2.a.b = circular2
      const circular3: any = []
      circular3.push(circular3)

      for (const obj of [circular1, circular2, circular3]) {
        const result = await captureOutputAndError(() => logger.log(obj))
        expect(result.error).toBeUndefined()
      }
    })

    it('should handle objects with unusual properties', async () => {
      const logger = withEnv(envPresets.NO_COLOR, () =>
        createColorino(createTestPalette(), { disableWarnings: true })
      )
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
        const result = await captureOutputAndError(() => logger.log(obj))
        expect(result.error).toBeUndefined()
      }
    })

    it('should handle deeply nested objects', async () => {
      const logger = withEnv(envPresets.NO_COLOR, () =>
        createColorino(createTestPalette(), { disableWarnings: true })
      )
      let deep: any = { value: 'bottom' }
      for (let i = 0; i < 100; i++) {
        deep = { level: i, child: deep }
      }
      const result = await captureOutputAndError(() => logger.log(deep))
      expect(result.error).toBeUndefined()
    })

    it('should handle large arrays with mixed types', async () => {
      const logger = withEnv(envPresets.NO_COLOR, () =>
        createColorino(createTestPalette(), { disableWarnings: true })
      )
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

      const result = await captureOutputAndError(() => logger.log(largeArray))
      expect(result.error).toBeUndefined()
    })
  })

  describe('Random Color Codes', () => {
    it('should handle invalid hex colors', () => {
      expect(() => {
        createColorino(createTestPalette({ log: '#gggggg' }))
      }).toThrow(ColorinoError)
    })

    it('should handle 1000 random hex colors', async () => {
      for (let i = 0; i < 1000; i++) {
        const hex = `#${Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, '0')}`
        const logger = withEnv(envPresets.ANSI256, () =>
          createColorino(createTestPalette({ log: hex }), {
            disableWarnings: true,
          })
        )
        const result = await captureOutputAndError(() => logger.log('test'))
        expect(result.error).toBeUndefined()
        expect(result.output).toBeTruthy()
      }
    })
  })

  describe('Random Environment Configurations', () => {
    it('should handle random environment variable combinations', async () => {
      const envVars = [
        'NO_COLOR',
        'FORCE_COLOR',
        'TERM',
        'COLORTERM',
        'WT_SESSION',
      ]
      const values = ['', '0', '1', 'true', 'false', 'xterm', 'dumb', undefined]

      for (let i = 0; i < 100; i++) {
        const randomEnv: Record<string, string | undefined> = {}
        envVars.forEach(key => {
          randomEnv[key] = values[Math.floor(Math.random() * values.length)]
        })
        const logger = withEnv(randomEnv, () =>
          createColorino(createTestPalette(), { disableWarnings: true })
        )
        const result = await captureOutputAndError(() => logger.log('test'))
        expect(result.error).toBeUndefined()
      }
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle rapid sequential logs', async () => {
      const logger = withEnv(envPresets.NO_COLOR, () =>
        createColorino(createTestPalette(), { disableWarnings: true })
      )
      const result = await captureOutputAndError(() => {
        for (let i = 0; i < 1000; i++) {
          logger.log(`Message ${i}`)
        }
      })
      expect(result.error).toBeUndefined()
    })

    it('should handle interleaved log levels', async () => {
      const logger = withEnv(envPresets.ANSI, () =>
        createColorino(createTestPalette(), { disableWarnings: true })
      )
      const result = await captureOutputAndError(() => {
        for (let i = 0; i < 250; i++) {
          logger.log(`log ${i}`)
          logger.info(`info ${i}`)
          logger.warn(`warn ${i}`)
          logger.error(`error ${i}`)
        }
      })
      expect(result.error).toBeUndefined()
    })
  })
})
