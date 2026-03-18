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

      logger.info('should not show info')
      logger.warn('should show warn')
      logger.error('should show error')

      const combinedOutput = stdoutSpy.getOutput() + stderrSpy.getOutput()
      expect(combinedOutput).not.toContain('should not show info')
      expect(combinedOutput).toContain('should show warn')
      expect(combinedOutput).toContain('should show error')
    })

    test('respects allow list', ({ stdoutSpy, stderrSpy }) => {
      const logger = createColorino({}, { logLevel: { allow: ['error', 'debug'] } })

      logger.info('no info')
      logger.warn('no warn')
      logger.error('yes error')
      logger.debug('yes debug')

      const combinedOutput = stdoutSpy.getOutput() + stderrSpy.getOutput()
      expect(combinedOutput).not.toContain('no info')
      expect(combinedOutput).not.toContain('no warn')
      expect(combinedOutput).toContain('yes error')
      expect(combinedOutput).toContain('yes debug')
    })

    test('respects deny list', ({ stdoutSpy, stderrSpy }) => {
      const logger = createColorino({}, { logLevel: { deny: ['warn'] } })

      logger.info('yes info')
      logger.warn('no warn')
      logger.error('yes error')

      const combinedOutput = stdoutSpy.getOutput() + stderrSpy.getOutput()
      expect(combinedOutput).toContain('yes info')
      expect(combinedOutput).not.toContain('no warn')
      expect(combinedOutput).toContain('yes error')
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
      expect(output).toMatch(/Hello with meta \[.+:\d+:\d+\]/)
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
            resolve: (frame) => ({ ...frame, file: 'custom-file.ts' })
          }
        }
      })

      logger.log('Hook test')

      const output = stdoutSpy.getOutput()
      expect(output).toContain('[custom-file.ts')
    })
  })

  describe('File Logging Integration', () => {
    const logFilePath = path.resolve(process.cwd(), 'temp-extension-verification.log')

    test.afterEach(() => {
      if (fs.existsSync(logFilePath)) fs.unlinkSync(logFilePath)
    })

    test('writes to file asynchronously', async () => {
      const logger = createColorino({}, {
        fileLogging: { isEnabled: true, path: 'temp-extension-verification.log', isAppendMode: false }
      })

      logger.info('file log test message')

      // Allow some time for background write
      await new Promise(resolve => setTimeout(resolve, 250))

      expect(fs.existsSync(logFilePath)).toBe(true)
      const content = fs.readFileSync(logFilePath, 'utf8')
      expect(content).toContain('[info] file log test message')
    })
  })
})
