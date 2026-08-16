import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, vi } from 'vitest'
import { log } from '../../log-decorator.js'
import { createColorino } from '../../node.js'
import { test } from '../helpers/console-spy.js'

describe('enhanced Node logging', () => {
  test('formats non-serializable values and redacts credentials', ({
    logger,
    stdoutSpy,
  }) => {
    const circular: Record<string, unknown> = {
      password: 'hidden',
      count: 1n,
      callback: () => 'value',
    }
    circular['self'] = circular

    logger.log(circular)

    const output = stdoutSpy.getOutput()
    expect(output).toContain('[Circular]')
    expect(output).toContain('1n')
    expect(output).toContain('[Function: callback]')
    expect(output).toContain('[REDACTED]')
    expect(output).not.toContain('hidden')
  })

  test('writes ANSI-free rotated log files', () => {
    const directory = mkdtempSync(join(tmpdir(), 'colorino-'))
    const path = join(directory, 'application.log')
    const logger = createColorino(
      { log: '#00ff00' },
      {
        fileLogging: { path, maxBytes: 80, maxFiles: 2 },
      }
    )

    logger.log('first', { password: 'hidden' })
    logger.log('second', { token: 'secret' })
    logger.log('third')

    const output = readFileSync(path, 'utf8')
    expect(output).not.toContain(String.fromCharCode(27))
    expect(output).not.toContain('hidden')
    expect(output).not.toContain('secret')
    expect(output).toContain('third')
    expect(existsSync(`${path}.1`)).toBe(true)

    rmSync(directory, { recursive: true, force: true })
  })

  test('formats timestamps in the configured timezone', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-02T12:34:56.000Z'))
    const directory = mkdtempSync(join(tmpdir(), 'colorino-'))
    const path = join(directory, 'application.log')
    const logger = createColorino(
      {},
      {
        fileLogging: { path, timezone: 'UTC' },
      }
    )

    logger.info('timestamp')

    expect(readFileSync(path, 'utf8')).toContain('[2024-01-02T12:34:56]')
    rmSync(directory, { recursive: true, force: true })
    vi.useRealTimers()
  })

  test('logs decorated sync and async methods at the configured level', async ({
    stdoutSpy,
    stderrSpy,
  }) => {
    vi.stubEnv('NO_COLOR', '1')
    const logger = createColorino()

    class Service {
      @log(logger, { logLevel: 'info' })
      getValue(value: string): string {
        return value.toUpperCase()
      }

      @log(logger, { logLevel: 'warn' })
      async getAsyncValue(value: string): Promise<string> {
        return value.toUpperCase()
      }
    }

    const service = new Service()
    expect(service.getValue('sync')).toBe('SYNC')
    await expect(service.getAsyncValue('async')).resolves.toBe('ASYNC')

    const output = `${stdoutSpy.getOutput()}${stderrSpy.getOutput()}`
    expect(output).toContain('getValue() called')
    expect(output).toContain('getValue() returned')
    expect(output).toContain('getAsyncValue() called')
    expect(output).toContain('getAsyncValue() returned')
  })

  test('writes only enabled levels to the file logger', () => {
    const directory = mkdtempSync(join(tmpdir(), 'colorino-'))
    const path = join(directory, 'application.log')
    const logger = createColorino({}, { level: 'warn', fileLogging: { path } })

    logger.info('info-hidden')
    logger.warn('warn-visible')
    logger.error('error-visible')

    const output = readFileSync(path, 'utf8')
    expect(output).not.toContain('info-hidden')
    expect(output).toContain('WARN warn-visible')
    expect(output).toContain('ERROR error-visible')

    rmSync(directory, { recursive: true, force: true })
  })

  test('decorator respects the logger threshold', ({
    stdoutSpy,
    stderrSpy,
  }) => {
    vi.stubEnv('NO_COLOR', '1')
    const logger = createColorino({}, { level: 'warn' })

    class Service {
      @log(logger, { logLevel: 'info' })
      getValue(value: string): string {
        return value.toUpperCase()
      }
    }

    expect(new Service().getValue('sync')).toBe('SYNC')

    const output = `${stdoutSpy.getOutput()}${stderrSpy.getOutput()}`
    expect(output).not.toContain('getValue()')
  })
})
