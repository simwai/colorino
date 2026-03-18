import { describe, expect, vi } from 'vitest'
import { createColorino } from '../../node.js'
import { test } from '../helpers/console-spy.js'
import * as fs from 'node:fs'
import * as path from 'node:path'

describe('Colorino - Node Extensions', () => {
  describe('Log-level Filtering', () => {
    test.scoped({ env: { NO_COLOR: '1' } })

    test('respects min log level', ({ stdoutSpy, stderrSpy }) => {
      const logger = createColorino({}, { logLevel: { min: 'warn' } })

      logger.info('should not show')
      logger.warn('should show warn')
      logger.error('should show error')

      const combined = stdoutSpy.getOutput() + stderrSpy.getOutput()
      expect(combined).not.toContain('should not show')
      expect(combined).toContain('should show warn')
      expect(combined).toContain('should show error')
    })

    test('respects allow list', ({ stdoutSpy, stderrSpy }) => {
      const logger = createColorino({}, { logLevel: { allow: ['error', 'debug'] } })

      logger.info('no info')
      logger.warn('no warn')
      logger.error('yes error')
      logger.debug('yes debug')

      const combined = stdoutSpy.getOutput() + stderrSpy.getOutput()
      expect(combined).not.toContain('no info')
      expect(combined).not.toContain('no warn')
      expect(combined).toContain('yes error')
      expect(combined).toContain('yes debug')
    })

    test('respects deny list', ({ stdoutSpy, stderrSpy }) => {
      const logger = createColorino({}, { logLevel: { deny: ['warn'] } })

      logger.info('yes info')
      logger.warn('no warn')
      logger.error('yes error')

      const combined = stdoutSpy.getOutput() + stderrSpy.getOutput()
      expect(combined).toContain('yes info')
      expect(combined).not.toContain('no warn')
      expect(combined).toContain('yes error')
    })
  })

  describe('Call-site Metadata', () => {
    test.scoped({ env: { NO_COLOR: '1' } })

    test('injects basic filename and line number when enabled', ({ stdoutSpy }) => {
      const logger = createColorino({}, {
        metadata: { callSite: { isEnabled: true } }
      })

      logger.log('Hello with meta')

      const output = stdoutSpy.getOutput()
      // Matches [filename.spec.ts:line:column] or [filename.spec.ts:line:col:line:col]
      expect(output).toMatch(/Hello with meta \[.+:\d+:\d+.*\]/)
    })

    test('respects position prefix', ({ stdoutSpy }) => {
      const logger = createColorino({}, {
        metadata: { callSite: { isEnabled: true, position: 'prefix' } }
      })

      logger.log('message')

      const output = stdoutSpy.getOutput()
      expect(output.trim().startsWith('[')).toBe(true)
    })

    test('resolves metadata via hook', ({ stdoutSpy }) => {
      const logger = createColorino({}, {
        metadata: {
          callSite: {
            isEnabled: true,
            resolve: (f) => ({ ...f, file: 'custom.ts' })
          }
        }
      })

      logger.log('Hook test')

      const output = stdoutSpy.getOutput()
      expect(output).toContain('[custom.ts')
    })
  })

  describe('File Logging Integration', () => {
    const logFile = path.resolve(process.cwd(), 'temp-extension-2.log')

    test.afterEach(() => {
      if (fs.existsSync(logFile)) fs.unlinkSync(logFile)
    })

    test('writes to file asynchronously', async () => {
      const logger = createColorino({}, {
        fileLogging: { isEnabled: true, path: 'temp-extension-2.log', isAppendMode: false }
      })

      logger.info('file log test')

      // Give it a moment to write
      await new Promise(r => setTimeout(r, 200))

      expect(fs.existsSync(logFile)).toBe(true)
      const content = fs.readFileSync(logFile, 'utf8')
      expect(content).toContain('[info] file log test')
    })
  })
})
