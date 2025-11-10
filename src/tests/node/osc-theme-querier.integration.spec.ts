import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReadStream, WriteStream } from 'node:tty'
import { OscThemeQuerier } from '../../osc-theme-querier.js'

describe('OscThemeQuerier - Node Environment - Integration Test', () => {
  let mockStdin: any
  let mockStdout: any
  let onDataCallback: (chunk: string | Buffer) => void

  beforeEach(() => {
    vi.useFakeTimers()

    mockStdout = {
      isTTY: true,
      writtenData: [] as string[],
      write: vi.fn((chunk: string) => {
        mockStdout.writtenData.push(chunk)
      }),
    }

    mockStdin = {
      isTTY: true,
      isRaw: false,
      setRawMode: vi.fn(),
      on: vi.fn((event: string, callback: (chunk: string | Buffer) => void) => {
        if (event === 'data') {
          onDataCallback = callback
        }
      }),
      removeListener: vi.fn(),
      pushData: (data: string) => {
        if (onDataCallback) {
          onDataCallback(data)
        }
      },
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "dark" for a dark background response', async () => {
    const querier = new OscThemeQuerier(mockStdin as unknown as ReadStream, mockStdout as unknown as WriteStream)
    const queryPromise = querier.query()

    mockStdin.pushData('\x1b]11;rgb:0a/0b/0c\x1b\\')

    const result = await queryPromise
    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toBe('dark')
    expect(mockStdout.write).toHaveBeenCalledWith('\x1b]11;?\x1b\\')
  })

  it('should return "light" for a light background response', async () => {
    const querier = new OscThemeQuerier(mockStdin as unknown as ReadStream, mockStdout as unknown as WriteStream)
    const queryPromise = querier.query()

    mockStdin.pushData('\x1b]11;rgb:ff/fa/f1\x1b\\')

    const result = await queryPromise
    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toBe('light')
  })

  it('should return a cached result on subsequent queries', async () => {
    const querier = new OscThemeQuerier(mockStdin as unknown as ReadStream, mockStdout as unknown as WriteStream)
    const firstQuery = querier.query()
    mockStdin.pushData('\x1b]11;rgb:00/00/00\x1b\\')
    await firstQuery

    const secondResult = await querier.query()
    expect(secondResult.isOk()).toBe(true)
    expect(secondResult._unsafeUnwrap()).toBe('dark')
    expect(mockStdout.write).toHaveBeenCalledTimes(1)
  })

  it('should return a timeout error if the terminal does not respond', async () => {
    const querier = new OscThemeQuerier(mockStdin as unknown as ReadStream, mockStdout as unknown as WriteStream, 100)
    const queryPromise = querier.query()

    await vi.advanceTimersByTimeAsync(101)

    const result = await queryPromise
    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr().message).toContain('timeout')
  })

  it('should return a TTY error if not in a TTY environment', async () => {
    mockStdout.isTTY = false
    const querier = new OscThemeQuerier(mockStdin as unknown as ReadStream, mockStdout as unknown as WriteStream)
    const result = await querier.query()

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr().message).toBe('Not a TTY environment')
  })
})
