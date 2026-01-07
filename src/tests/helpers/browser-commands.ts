import type { BrowserCommand } from 'vitest/node'

export const emulateColorScheme: BrowserCommand<['light' | 'dark']> = async (
  { page, provider },
  scheme
) => {
  if (provider.name !== 'playwright') {
    throw new Error(`Provider ${provider.name} doesn't support emulateMedia`)
  }

  await page.emulateMedia({ colorScheme: scheme })

  const browserName = page.context().browser()?.browserType().name()
  if (browserName === 'firefox') {
    await page.reload({ waitUntil: 'domcontentloaded' })
  }
}
