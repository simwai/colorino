import { describe, expect, it } from 'vitest'
import { createColorino } from '../../node.js'
import { test } from '../helpers/console-spy.js'

describe('Colorino - Node Extensions', () => {
  describe('Log-level Filtering', () => {
    test.scoped({ env: { NO_COLOR: '1' } })

    test('respects min log level', ({ stdoutSpy, stderrSpy }) => {
      const logger = createColorino({}, { logLevel: { min: 'warn' } })
      logger.info('no')
      logger.warn('yes warn')
      const combined = stdoutSpy.getOutput() + stderrSpy.getOutput()
      expect(combined).not.toContain('no')
      expect(combined).toContain('yes warn')
    })
  })

  describe('Call-site Metadata', () => {
    test.scoped({ env: { NO_COLOR: '1' } })

    test('injects basic filename and line number when enabled', ({ stdoutSpy }) => {
      const logger = createColorino({}, { metadata: { callSite: { isEnabled: true } } })
      logger.log('Hello with meta')
      const output = stdoutSpy.getOutput()
      expect(output).toMatch(/Hello with meta \[.+:\d+:\d+\]/)
    })
  })
})
