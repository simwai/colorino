import { describe, it, expect } from 'vitest'
import { Colorino } from '../colorino.js'
import { InputValidator } from '../input-validator.js'
import { NodeColorSupportDetector } from '../node-color-support-detector.js'
import type { Palette, ColorinoOptions } from '../types.js'
import {
  captureBoth,
  captureStderr,
  captureStdout,
} from './helpers/console-capture.js'
import { withEnv, ENV_PRESETS } from './helpers/env-helpers.js'
import { generateRandomString } from './helpers/random.js'
import { createTestPalette } from './helpers/test-setup.js'

/**
 * Test factory using the project's `createTestPalette` helper.
 * This ensures all tests use a valid, complete palette.
 */
const createLogger = (
  palette: Partial<Palette> = {},
  options: ColorinoOptions = {}
) => {
  const fullPalette = createTestPalette(palette)
  const validator = new InputValidator()
  const nodeDetector = new NodeColorSupportDetector(process)
  return new Colorino(fullPalette, validator, undefined, nodeDetector, options)
}

describe('Colorino - Integration Tests', () => {
  describe('Basic Logging Workflow (Critical Path)', () => {
    it('should output colored text when FORCE_COLOR is set', async () => {
      const result = await withEnv(ENV_PRESETS.ANSI256, () => {
        const logger = createLogger({ log: '#00ff00' })
        return captureStdout(() => logger.log('Hello, Colorino!'))
      })

      expect(result.isOk()).toBe(true)
      const output = result.unwrapOr('')
      expect(output).toMatch(/\x1b\[38;5;\d+m/)
      expect(output).toContain('Hello, Colorino!')
    })

    it('should output plain text when NO_COLOR is set', async () => {
      const result = await withEnv(ENV_PRESETS.NO_COLOR, () => {
        const logger = createLogger()
        return captureStdout(() => logger.log('Plain text message'))
      })

      expect(result.isOk()).toBe(true)
      expect(result.unwrapOr('')).toContain('Plain text message')
    })
  })

  describe('Color Format Conversion (Integration Point)', () => {
    it('should use truecolor codes when FORCE_COLOR=3', async () => {
      const result = await withEnv(ENV_PRESETS.TRUECOLOR, () => {
        const logger = createLogger({ log: '#ff5733' })
        return captureStdout(() => logger.log('test'))
      })
      expect(result.isOk()).toBe(true)
      expect(result.unwrapOr('')).toMatch(/\x1b\[38;2;\d+;\d+;\d+m/)
    })

    it('should use 256-color codes when FORCE_COLOR=2', async () => {
      const result = await withEnv(ENV_PRESETS.ANSI256, () => {
        const logger = createLogger({ log: '#00ff00' })
        return captureStdout(() => logger.log('test'))
      })
      expect(result.isOk()).toBe(true)
      expect(result.unwrapOr('')).toMatch(/\x1b\[38;5;\d+m/)
    })

    it('should use basic ANSI codes when FORCE_COLOR=1', async () => {
      const result = await withEnv(ENV_PRESETS.ANSI, () => {
        const logger = createLogger({ log: '#00ff00' })
        return captureStdout(() => logger.log('test'))
      })
      expect(result.isOk()).toBe(true)
      // FIX: The regex now correctly accounts for both regular (30-37) and
      // bright (90-97) ANSI color codes, which are both valid.
      expect(result.unwrapOr('')).toMatch(/\x1b\[(3|9)\dm/)
    })
  })

  describe('Multi-Argument Formatting', () => {
    it('should handle multiple arguments correctly', async () => {
      const result = await withEnv(ENV_PRESETS.NO_COLOR, () => {
        const logger = createLogger()
        return captureStdout(() => logger.log('Count:', 42, { active: true }))
      })

      expect(result.isOk()).toBe(true)
      const output = result.unwrapOr('')

      // NOTE: This assertion now passes because the `_capture` helper was
      // fixed to use `util.format`, which correctly stringifies objects.
      expect(output).toContain('Count: 42 { active: true }')
    })
  })

  describe('Color Support Detection Warning', () => {
    it('should warn when no color support detected (by default)', async () => {
      const result = await withEnv(ENV_PRESETS.NO_COLOR, () => {
        return captureBoth(() => createLogger())
      })

      expect(result.isOk()).toBe(true)
      const { stderr } = result.unwrapOr({ stdout: '', stderr: '' })

      // NOTE: This assertion now passes because the Colorino constructor logic
      // was fixed to correctly trigger a warning when ColorLevel is NO_COLOR.
      expect(stderr).toContain('[Colorino]')
      expect(stderr).toContain('No ANSI color support detected')
    })
  })

  describe('Edge Cases', () => {
    it('should throw an error for invalid palette entries at construction', () => {
      expect(() => {
        createLogger({ log: 'not-a-valid-color' })
      }).toThrow(/Invalid hex color/)
    })

    it('should handle arbitrary string inputs without crashing', async () => {
      const randomInput = generateRandomString(100)
      const result = await withEnv(ENV_PRESETS.NO_COLOR, () => {
        const logger = createLogger()
        return captureStdout(() => logger.log(randomInput))
      })

      expect(result.isOk()).toBe(true)
      expect(result.unwrapOr('')).toContain(randomInput)
    })
  })

  describe('All Standard Log Levels', () => {
    it('should support all standard console methods', async () => {
      const logger = createLogger()

      const logRes = await captureStdout(() => logger.log('log'))
      expect(logRes.unwrapOr('')).toContain('log')

      const infoRes = await captureStdout(() => logger.info('info'))
      expect(infoRes.unwrapOr('')).toContain('info')

      const warnRes = await captureStderr(() => logger.warn('warn'))
      expect(warnRes.unwrapOr('')).toContain('warn')

      const errorRes = await captureStderr(() => logger.error('error'))
      expect(errorRes.unwrapOr('')).toContain('error')

      const debugRes = await captureStdout(() => logger.debug('debug'))
      expect(debugRes.unwrapOr('')).toContain('debug')

      const traceRes = await captureStderr(() => logger.trace('trace'))
      expect(traceRes.unwrapOr('')).toContain('Trace: trace')
    })
  })
})
