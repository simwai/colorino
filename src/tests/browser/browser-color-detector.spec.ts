import { describe, expect, test as baseTest } from 'vitest'
import { commands } from 'vitest/browser'
import { BrowserColorSupportDetector } from '../../browser-color-support-detector.js'
import { ColorLevel } from '../../enums.js'

interface BrowserColorDetectorFixtures {
  browserDetector: BrowserColorSupportDetector
  colorLevel: ColorLevel
}

const test = baseTest.extend<BrowserColorDetectorFixtures>({
  // eslint-disable-next-line
  browserDetector: async ({}, use) => {
    const detector = new BrowserColorSupportDetector(true, window, navigator)
    await use(detector)
  },
  colorLevel: async ({ browserDetector }, use) => {
    const colorLevel = browserDetector.getColorLevel()
    await use(colorLevel)
  },
})

describe('Colorino - Real Browser - Unit Test', () => {
  test('should detect color level in real browser', ({ colorLevel }) => {
    expect(colorLevel).toBeDefined()
    expect(colorLevel).toBeGreaterThanOrEqual(ColorLevel.ANSI)
  })

  test('should detect dark theme', async ({ browserDetector }) => {
    await commands.emulateColorScheme('dark')

    const theme = browserDetector.getTheme()

    expect(theme).toBe('dark')
  })

  test('should detect light theme', async ({ browserDetector }) => {
    await commands.emulateColorScheme('light')

    const theme = browserDetector.getTheme()

    expect(theme).toBe('light')
  })
})
