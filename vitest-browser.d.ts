import type { Page } from 'playwright'

declare module 'vitest/node' {
  interface BrowserCommandContext {
    page: Page
    context: import('playwright').BrowserContext
    frame: () => Promise<import('playwright').Frame>
    iframe: import('playwright').FrameLocator
  }
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateColorScheme: (scheme: 'light' | 'dark') => Promise<void>
  }
}

export {}