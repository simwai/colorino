import { describe, it, expect } from 'vitest'
import { createColorino } from '../../node.js'
import { captureBoth, captureStdout } from '../helpers/console-capture.js'
import { envPresets, withEnv } from '../helpers/env-helpers.js'
import { generateRandomString } from '../helpers/random.js'
import { createTestPalette } from '../helpers/test-setup.js'

describe('Colorino - Node Environment - Integration Test', () => {
  describe('Basic Logging Workflow (Critical Path)', () => {
    it('should output colored text when FORCE_COLOR is set', async () => {
      const result = await withEnv(envPresets.ANSI256, () => {
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), {
          disableWarnings: true,
        })
        return captureStdout(() => logger.log('Hello, Colorino!'))
      })

      expect(result.isOk()).toBe(true)
      // FIX: Expect reset code [0m and a newline
      expect(result.unwrapOr('')).toBe(
        '\u001B[38;5;46mHello, Colorino!\u001B[0m\n'
      )
    })

    it('should output plain text when NO_COLOR is set', async () => {
      const result = await withEnv(envPresets.NO_COLOR, () => {
        const logger = createColorino(createTestPalette(), {
          disableWarnings: true,
        })
        return captureStdout(() => logger.log('Plain text message'))
      })

      expect(result.isOk()).toBe(true)
      const output = result.unwrapOr('')
      expect(output).not.toMatch(/\x1b\[\d+m/)
      expect(output).toBe('Plain text message\n')
    })
  })

  describe('Color Format Conversion (Integration Point)', () => {
    it('should use truecolor codes when FORCE_COLOR=3', async () => {
      const result = await withEnv(envPresets.TRUECOLOR, () => {
        const logger = createColorino(createTestPalette({ log: '#ff5733' }), {
          disableWarnings: true,
        })
        return captureStdout(() => logger.log('test'))
      })
      expect(result.isOk()).toBe(true)
      // FIX: Expect reset code [0m and a newline
      expect(result.unwrapOr('')).toBe('\u001B[38;2;255;87;51mtest\u001B[0m\n')
    })

    it('should use 256-color codes when FORCE_COLOR=2', async () => {
      const result = await withEnv(envPresets.ANSI256, () => {
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), {
          disableWarnings: true,
        })
        return captureStdout(() => logger.log('test'))
      })
      expect(result.isOk()).toBe(true)
      // FIX: Expect reset code [0m and a newline
      expect(result.unwrapOr('')).toBe('\u001B[38;5;46mtest\u001B[0m\n')
    })

    it('should use basic ANSI codes when FORCE_COLOR=1', async () => {
      const result = await withEnv(envPresets.ANSI, () => {
        const logger = createColorino(createTestPalette({ log: '#00ff00' }), {
          disableWarnings: true,
        })
        return captureStdout(() => logger.log('test'))
      })
      expect(result.isOk()).toBe(true)
      // FIX: Expect reset code [0m and a newline
      expect(result.unwrapOr('')).toBe('\u001B[92mtest\u001B[0m\n')
    })
  })

  // ... rest of the file remains the same ...
  describe('Multi-Argument Formatting', () => {
    it('should handle multiple arguments correctly', async () => {
      const result = await withEnv(envPresets.NO_COLOR, () => {
        const logger = createColorino(createTestPalette(), {
          disableWarnings: true,
        })
        return captureStdout(() => logger.log('Count:', 42, { active: true }))
      })

      expect(result.isOk()).toBe(true)
      expect(result.unwrapOr('')).toBe('Count: 42 { active: true }\n')
    })
  })

  describe('Color Support Detection Warning', () => {
    it('should warn when no color support detected (by default)', async () => {
      const result = await withEnv(envPresets.NO_COLOR, () => {
        return captureBoth(() => createColorino(createTestPalette()))
      })

      expect(result.isOk()).toBe(true)
      const { stderr } = result.unwrapOr({ stdout: '', stderr: '' })
      expect(stderr).toContain('[Colorino]')
      expect(stderr).toContain('No ANSI color support detected')
    })
  })

  describe('Edge Cases', () => {
    it('should throw an error for invalid palette entries at construction', () => {
      expect(() => {
        createColorino(createTestPalette({ log: 'not-a-valid-color' }))
      }).toThrow(/Invalid hex color/)
    })

    it('should handle arbitrary string inputs without crashing', async () => {
      const randomInput = generateRandomString(100)
      const result = await withEnv(envPresets.NO_COLOR, () => {
        const logger = createColorino(createTestPalette(), {
          disableWarnings: true,
        })
        return captureStdout(() => logger.log(randomInput))
      })

      expect(result.isOk()).toBe(true)
      expect(result.unwrapOr('')).toBe(`${randomInput}\n`)
    })
  })

  describe('All Standard Log Levels', () => {
    it('should support all standard console methods', async () => {
      const logger = createColorino(createTestPalette(), {
        disableWarnings: true,
      })

      const result = await captureBoth(() => {
        logger.log('log')
        logger.info('info')
        logger.warn('warn')
        logger.error('error')
        logger.debug('debug')
        logger.trace('trace')
      })

      expect(result.isOk()).toBe(true)
      const { stdout, stderr } = result.unwrapOr({ stdout: '', stderr: '' })

      expect(stdout).toContain('log')
      expect(stdout).toContain('info')
      expect(stdout).toContain('debug')
      expect(stderr).toContain('warn')
      expect(stderr).toContain('error')
      expect(stderr).toContain('Trace: trace')
    })
  })
})
