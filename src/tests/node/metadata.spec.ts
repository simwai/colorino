import { describe, it, expect, vi } from 'vitest'
import { createColorino } from '../../node.js'

describe('Colorino - Metadata', () => {
  it('should include call-site metadata when enabled', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const logger = createColorino({}, {
      metadata: {
        callSite: {
          isEnabled: true
        }
      }
    })

    logger.log('test')

    const lastCall = logSpy.mock.calls[0]
    const output = lastCall ? lastCall.join(' ') : ''
    expect(output).toContain('[metadata.spec.ts:')

    logSpy.mockRestore()
  })
})
