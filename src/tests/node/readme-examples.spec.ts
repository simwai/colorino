import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Palette } from '../../types.js'
import type { ColorinoOptions } from '../../interfaces.js'
import { ColorinoNode } from '../../colorino-node.js'
import { createColorino } from '../../node.js'
import { NodeColorSupportDetector } from '../../node-color-support-detector.js'
import { InputValidator } from '../../input-validator.js'
import { determineBaseTheme } from '../../determine-base-theme.js'
import { themePalettes } from '../../theme.js'

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

function buildColorinoNode(
  palette: Partial<Palette> = {},
  options: ColorinoOptions = {}
): ConstructorParameters<typeof ColorinoNode> {
  const validator = new InputValidator()
  const themeOpt = options.theme ?? 'auto'

  let detectorThemeOverride: 'dark' | 'light' | 'unknown' | undefined
  if (themeOpt === 'dark' || themeOpt === 'light') {
    detectorThemeOverride = themeOpt
  } else if (themeOpt !== 'auto') {
    detectorThemeOverride = 'unknown'
  }

  const nodeDetector = new NodeColorSupportDetector(
    process,
    detectorThemeOverride,
    options.isOsc11Enabled
  )
  const detectedTheme =
    themeOpt === 'auto' ? nodeDetector.getTheme() : 'unknown'
  const baseThemeName = determineBaseTheme(themeOpt, detectedTheme)
  const basePalette = themePalettes[baseThemeName]
  const finalPalette = { ...basePalette, ...palette }
  const colorLevel = nodeDetector.isNodeEnv()
    ? (nodeDetector.getColorLevel() ?? 'UnknownEnv')
    : 'UnknownEnv'

  return [finalPalette, palette, validator, colorLevel, options]
}

class FatalLogger extends ColorinoNode {
  fatal(...args: unknown[]): void {
    this.error(...args)
  }
}

function createFatalLogger(
  palette?: Partial<Palette>,
  options?: ColorinoOptions
): FatalLogger {
  return new FatalLogger(...buildColorinoNode(palette, options))
}

class ContextLogger extends ColorinoNode {
  override info(...args: unknown[]): void {
    super.info(`[${getCallerContext()}]`, ...args)
  }

  override error(...args: unknown[]): void {
    super.error(`[${getCallerContext()}]`, ...args)
  }
}

function createContextLogger(
  palette?: Partial<Palette>,
  options?: ColorinoOptions
): ContextLogger {
  return new ContextLogger(...buildColorinoNode(palette, options))
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
