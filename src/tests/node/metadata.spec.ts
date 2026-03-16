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
    const output = lastCall.join(' ')
    expect(output).toContain('[metadata.spec.ts:')

    logSpy.mockRestore()
  })

  it('should respect metadata position', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const logger = createColorino({}, {
      metadata: {
        callSite: {
          isEnabled: true,
          position: 'prefix'
        }
      }
    })

    logger.log('test')

    const lastCall = logSpy.mock.calls[0]
    // Prefix tag should be first argument (or part of first string if colored)
    expect(String(lastCall[0])).toContain('[metadata.spec.ts:')

    logSpy.mockRestore()
  })
})
