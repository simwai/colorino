import { describe, expect, vi, test as baseTest } from 'vitest'
import { createColorino } from '../../browser.js'

interface BrowserFixtures {
  mocks: {
    log: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
  }
}

const test = baseTest.extend<BrowserFixtures>({
  mocks: async ({ task: _ }, use) => {
    const spies = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    }
    await use(spies)
    vi.restoreAllMocks()
  },
})

describe('Colorino - Browser Extensions', () => {
  test('Log-level Filtering: respects min log level', ({ mocks }) => {
    const logger = createColorino(
      {},
      {
        logLevel: { min: 'warn' },
      }
    )

    logger.info('no info')
    logger.warn('yes warn')

    expect(mocks.log).not.toHaveBeenCalled()
    // In browser, warn goes to console.warn
    expect(mocks.warn).toHaveBeenCalledWith(
      expect.stringContaining('yes warn'),
      expect.anything()
    )
  })
})
