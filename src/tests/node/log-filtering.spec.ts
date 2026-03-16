import { describe, it, expect, vi } from 'vitest'
import { createColorino } from '../../node.js'

describe('Colorino - Log Filtering', () => {
  it('should filter logs based on min level', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    const logger = createColorino({}, { logLevel: { min: 'info' } })

    logger.debug('should not show')
    logger.info('should show')

    expect(debugSpy).not.toHaveBeenCalled()
    expect(infoSpy).toHaveBeenCalled()

    debugSpy.mockRestore()
    infoSpy.mockRestore()
  })

  it('should use allow list', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const logger = createColorino({}, { logLevel: { allow: ['warn'] } })

    logger.info('not allowed')
    logger.warn('allowed')

    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()

    infoSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it('should use deny list', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const logger = createColorino({}, { logLevel: { deny: ['error'] } })

    logger.error('denied')

    expect(errorSpy).not.toHaveBeenCalled()

    errorSpy.mockRestore()
  })
})
