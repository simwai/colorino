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
})
