import { describe, expect, vi, test as baseTest } from 'vitest'
import { createColorino } from '../../browser.js'

interface BrowserFixtures {
  mocks: any
}

const test = baseTest.extend<BrowserFixtures>({
  mocks: async ({}, use) => {
    const spies = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    }
    await use(spies)
    vi.restoreAllMocks()
  },
})

describe('Colorino - Browser Extensions', () => {
  test('injects metadata tags in browser formatted output', ({ mocks }) => {
    const logger = createColorino({}, { metadata: { callSite: { isEnabled: true } } })
    logger.log('browser meta')
    const call = mocks.log.mock.calls[0]
    expect(call[0]).toContain('%c %s')
    expect(call[call.length - 1]).toMatch(/\[.+:\d+:\d+\]/)
  })
})
