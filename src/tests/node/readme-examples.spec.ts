import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Palette } from '../../types.js'
import type { ColorinoOptions } from '../../interfaces.js'
import { createColorino } from '../../node.js'

function getCallerContext(): string {
  const err = new Error()
  if (!err.stack) return 'unknown'

  const lines = err.stack.split('\n').slice(2)
  const frame = lines[0] ?? ''

  const match =
    frame.match(/at (.+?) \((.+?):(\d+):\d+\)/) ??
    frame.match(/at (.+?):(\d+):\d+/)

  if (!match) return frame.trim() || 'unknown'

  const [_, maybeFn, fileOrLine, maybeLine] = match
  const file = maybeLine ? fileOrLine : maybeFn
  const line = maybeLine ?? fileOrLine

  return `${file}:${line}`
}

type FatalLogger = ReturnType<typeof createColorino> & {
  fatal(...args: unknown[]): void
}

function createFatalLogger(
  palette?: Partial<Palette>,
  options?: ColorinoOptions
): FatalLogger {
  const base = createColorino(palette, options)
  const logger = Object.create(base) as FatalLogger

  Object.assign(logger, {
    fatal(...args: unknown[]) {
      logger.error(...args)
    },
  })

  return logger
}

function createContextLogger(
  palette?: Partial<Palette>,
  options?: ColorinoOptions
): ReturnType<typeof createColorino> {
  const base = createColorino(palette, options)

  // Inherit all default methods from the base logger...
  const logger = Object.create(base) as ReturnType<typeof createColorino> // Object.create uses `base` as the prototype.

  // ...and override only what you need.
  Object.assign(logger, {
    // Object.assign copies these methods onto `logger`.
    info(...args: unknown[]) {
      base.info(`[${getCallerContext()}]`, ...args)
    },
    error(...args: unknown[]) {
      base.error(`[${getCallerContext()}]`, ...args)
    },
  })

  return logger
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('README examples', () => {
  it('fatal() delegates to error()', () => {
    const logger = createFatalLogger({}, { theme: 'dracula' })
    const errorSpy = vi.spyOn(logger, 'error')

    logger.fatal('Boom', { id: 999 })

    expect(errorSpy).toHaveBeenCalledWith('Boom', { id: 999 })
  })

  it('calls logger + logger2 with expected args', () => {
    const logger = createContextLogger()
    const logger2 = createFatalLogger({}, { theme: 'dracula' })

    const loggerInfoSpy = vi.spyOn(logger, 'info')
    const loggerErrorSpy = vi.spyOn(logger, 'error')
    const logger2InfoSpy = vi.spyOn(logger2, 'info')
    const logger2ErrorSpy = vi.spyOn(logger2, 'error')

    logger.info('User created', { id: 123 })
    logger.error('Failed to load user', { id: 456 })
    logger2.info('User created', { id: 123 })
    logger2.error('Failed to load user', { id: 456 })

    expect(loggerInfoSpy).toHaveBeenCalledWith('User created', { id: 123 })
    expect(loggerErrorSpy).toHaveBeenCalledWith('Failed to load user', {
      id: 456,
    })
    expect(logger2InfoSpy).toHaveBeenCalledWith('User created', { id: 123 })
    expect(logger2ErrorSpy).toHaveBeenCalledWith('Failed to load user', {
      id: 456,
    })
  })
})
