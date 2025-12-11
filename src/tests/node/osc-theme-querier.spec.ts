import { test as base, describe, expect, vi } from 'vitest'
import type { ReadStream, WriteStream } from 'node:tty'
import { OscThemeQuerier } from '../../osc-theme-querier.js'

interface OscQuerierFixtures {
  mockStdout: {
    isTTY: boolean
    writtenData: string[]
    write: ReturnType<typeof vi.fn>
  }
  mockStdin: {
    isTTY: boolean
    isRaw: boolean
    setRawMode: ReturnType<typeof vi.fn>
    resume: ReturnType<typeof vi.fn>
    pause: ReturnType<typeof vi.fn>
    read: ReturnType<typeof vi.fn>
    on: ReturnType<typeof vi.fn>
    removeListener: ReturnType<typeof vi.fn>
    pushData: (data: string) => void
  }
  timeout: number
  querier: OscThemeQuerier
}

const test = base.extend<OscQuerierFixtures>({
  mockStdout: async ({}, use) => {
    await use({
      isTTY: true,
      writtenData: [],
      write: vi.fn(function (this: any, chunk: string) {
        this.writtenData.push(chunk)
      }),
    })
  },

  mockStdin: async ({}, use) => {
    let onDataCallback: ((chunk: string | Buffer) => void) | undefined
    const dataQueue: (string | null)[] = []

    await use({
      isTTY: true,
      isRaw: false,
      setRawMode: vi.fn(function (this: any, mode: boolean) {
        this.isRaw = mode
      }),
      resume: vi.fn(),
      pause: vi.fn(),
      read: vi.fn(() => {
        return dataQueue.shift() ?? null
      }),
      on: vi.fn((event: string, callback: (chunk: string | Buffer) => void) => {
        if (event === 'data') {
          onDataCallback = callback
        }
      }),
      removeListener: vi.fn(),
      pushData: (data: string) => {
        dataQueue.push(data)

        if (onDataCallback) {
          onDataCallback(data)
        }
      },
    })
  },

  timeout: [5000, { injected: true }],

  querier: async ({ mockStdin, mockStdout, timeout }, use) => {
    await use(
      new OscThemeQuerier(
        mockStdin as unknown as ReadStream,
        mockStdout as unknown as WriteStream,
        timeout
      )
    )
  },
})

describe('OscThemeQuerier - Node Environment - Unit Test', () => {
  describe('dark background response', () => {
    test('should return "dark"', ({ querier, mockStdin, mockStdout }) => {
      mockStdin.pushData('\x1b]11;rgb:0a/0b/0c\x1b\\')

      const result = querier.query()
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBe('dark')
      expect(mockStdout.write).toHaveBeenCalledWith('\x1b]11;?\x1b\\')
    })
  })

  describe('light background response', () => {
    test('should return "light"', ({ querier, mockStdin }) => {
      mockStdin.pushData('\x1b]11;rgb:ff/fa/f1\x1b\\')

      const result = querier.query()
      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBe('light')
    })
  })

  describe('caching behavior', () => {
    test('should return cached result on subsequent queries', ({
      querier,
      mockStdin,
      mockStdout,
    }) => {
      mockStdin.pushData('\x1b]11;rgb:00/00/00\x1b\\')
      querier.query()

      const secondResult = querier.query()
      expect(secondResult.isOk()).toBe(true)
      expect(secondResult._unsafeUnwrap()).toBe('dark')
      expect(mockStdout.write).toHaveBeenCalledTimes(1)
    })
  })

  describe('timeout handling', () => {
    describe('with 100ms timeout', () => {
      test.scoped({ timeout: 100 })

      test('should return timeout error if terminal does not respond', ({
        querier,
      }) => {
        const result = querier.query()

        expect(result.isErr()).toBe(true)
        expect(result._unsafeUnwrapErr().message).toContain('timeout')
      })
    })
  })

  describe('TTY validation', () => {
    describe('when not in TTY environment', () => {
      test.scoped({
        mockStdout: {
          isTTY: false,
          writtenData: [],
          write: vi.fn(function (this: any, chunk: string) {
            this.writtenData.push(chunk)
          }),
        },
      })

      test('should return TTY error', ({ querier }) => {
        const result = querier.query()

        expect(result.isErr()).toBe(true)
        expect(result._unsafeUnwrapErr().message).toBe('Not a TTY environment')
      })
    })
  })
})
