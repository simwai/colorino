import { test as base, describe, expect, vi } from 'vitest'
import { NodeColorSupportDetector } from '../../node-color-support-detector.js'
import { ColorLevel } from '../../enums.js'
import type { TerminalTheme } from '../../types.js'
import * as oscThemeSync from '../../osc-theme-sync.js'

interface ColorDetectorFixtures {
  mockStdin: {
    isTTY: boolean
    setRawMode: ReturnType<typeof vi.fn>
    resume: ReturnType<typeof vi.fn>
    pause: ReturnType<typeof vi.fn>
    read: ReturnType<typeof vi.fn>
    on: ReturnType<typeof vi.fn>
    removeListener: ReturnType<typeof vi.fn>
    isRaw: boolean
  }
  mockStdout: {
    isTTY: boolean
    write: ReturnType<typeof vi.fn>
  }
  env: NodeJS.ProcessEnv
  mockProcess: {
    env: NodeJS.ProcessEnv
    stdout: ColorDetectorFixtures['mockStdout']
    stdin: ColorDetectorFixtures['mockStdin']
  }
  detector: NodeColorSupportDetector
}

const test = base.extend<ColorDetectorFixtures>({
  // eslint-disable-next-line
  mockStdin: async ({}, use) => {
    await use({
      isTTY: true,
      setRawMode: vi.fn(),
      resume: vi.fn(),
      pause: vi.fn(),
      read: vi.fn(() => null),
      on: vi.fn(),
      removeListener: vi.fn(),
      isRaw: false,
    })
  },

  // eslint-disable-next-line
  mockStdout: async ({}, use) => {
    await use({
      isTTY: true,
      write: vi.fn(),
    })
  },

  env: [{}, { injected: true }],

  mockProcess: async ({ env, mockStdout, mockStdin }, use) => {
    await use({
      env,
      stdout: mockStdout,
      stdin: mockStdin,
    })
  },

  detector: async ({ mockProcess }, use) => {
    await use(new NodeColorSupportDetector(mockProcess as any))
  },
})

describe('NodeColorSupportDetector - Node Environment - Unit Test', () => {
  describe('theme detection (sync OSC)', () => {
    test('uses overrideTheme when provided', () => {
      const mockProcess: any = {
        env: {},
        stdout: { isTTY: true, write: vi.fn() },
        stdin: {
          isTTY: true,
          setRawMode: vi.fn(),
          resume: vi.fn(),
          pause: vi.fn(),
          read: vi.fn(),
          on: vi.fn(),
          removeListener: vi.fn(),
          isRaw: false,
        },
      }

      const detector = new NodeColorSupportDetector(
        mockProcess,
        'dark' as TerminalTheme
      )
      expect(detector.getTheme()).toBe('dark')
    })

    test('returns unknown when not a TTY', () => {
      const mockProcess: any = {
        env: {},
        stdout: { isTTY: false, write: vi.fn() },
        stdin: {
          isTTY: false,
          setRawMode: vi.fn(),
          resume: vi.fn(),
          pause: vi.fn(),
          read: vi.fn(),
          on: vi.fn(),
          removeListener: vi.fn(),
          isRaw: false,
        },
      }

      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getTheme()).toBe('unknown')
    })

    test('calls getTerminalThemeSync when TTY and no override', () => {
      const mockProcess: any = {
        env: {},
        stdout: { isTTY: true, write: vi.fn() },
        stdin: {
          isTTY: true,
          setRawMode: vi.fn(),
          resume: vi.fn(),
          pause: vi.fn(),
          read: vi.fn(),
          on: vi.fn(),
          removeListener: vi.fn(),
          isRaw: false,
        },
      }

      const spy = vi
        .spyOn(oscThemeSync, 'getTerminalThemeSync')
        .mockReturnValue('light')

      const detector = new NodeColorSupportDetector(mockProcess)
      expect(spy).toHaveBeenCalled()
      expect(detector.getTheme()).toBe('light')

      spy.mockRestore()
    })
  })

  describe('NO_COLOR environment variable', () => {
    describe('when NO_COLOR is set', () => {
      test.scoped({ env: { NO_COLOR: 'true' } })

      test('should return NO_COLOR', ({ detector }) => {
        expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
      })
    })

    describe('when it overrides other settings', () => {
      test.scoped({ env: { NO_COLOR: 'true', TERM: 'xterm-256color' } })

      test('should override TERM settings', ({ detector }) => {
        expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
      })
    })
  })

  describe('FORCE_COLOR environment variable', () => {
    describe('when FORCE_COLOR=3', () => {
      test.scoped({ env: { FORCE_COLOR: '3' } })

      test('should return TRUECOLOR', ({ detector }) => {
        expect(detector.getColorLevel()).toBe(ColorLevel.TRUECOLOR)
      })
    })

    describe('when FORCE_COLOR=2', () => {
      test.scoped({ env: { FORCE_COLOR: '2' } })

      test('should return ANSI256', ({ detector }) => {
        expect(detector.getColorLevel()).toBe(ColorLevel.ANSI256)
      })
    })

    describe('when FORCE_COLOR=1', () => {
      test.scoped({ env: { FORCE_COLOR: '1' } })

      test('should return ANSI', ({ detector }) => {
        expect(detector.getColorLevel()).toBe(ColorLevel.ANSI)
      })
    })

    describe('when FORCE_COLOR=0', () => {
      test.scoped({ env: { FORCE_COLOR: '0' } })

      test('should return NO_COLOR', ({ detector }) => {
        expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
      })
    })
  })

  describe('TTY detection', () => {
    describe('when not a TTY', () => {
      test.scoped({ mockStdout: { isTTY: false, write: vi.fn() } })

      test('should return NO_COLOR', ({ detector }) => {
        expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
      })
    })

    describe('when not a TTY but CLICOLOR_FORCE is set', () => {
      test.scoped({
        env: { CLICOLOR_FORCE: '1' },
        mockStdout: { isTTY: false, write: vi.fn() },
      })

      test('should detect color anyway', ({ detector }) => {
        expect(detector.getColorLevel()).toBe(ColorLevel.ANSI)
      })
    })
  })

  describe('TERM-based detection', () => {
    describe('with 256-color terminal', () => {
      test.scoped({ env: { TERM: 'xterm-256color' } })

      test('should detect ANSI256', ({ detector }) => {
        expect(detector.getColorLevel()).toBe(ColorLevel.ANSI256)
      })
    })

    describe('with basic ANSI terminal', () => {
      test.scoped({ env: { TERM: 'xterm' } })

      test('should detect ANSI', ({ detector }) => {
        expect(detector.getColorLevel()).toBe(ColorLevel.ANSI)
      })
    })

    describe('with dumb terminal', () => {
      test.scoped({ env: { TERM: 'dumb' } })

      test('should return NO_COLOR', ({ detector }) => {
        expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
      })
    })
  })

  describe('Edge Cases', () => {
    describe('with malformed FORCE_COLOR', () => {
      test.scoped({ env: { FORCE_COLOR: 'invalid' } })

      test('should handle gracefully', ({ detector }) => {
        const level = detector.getColorLevel()
        expect(level).toBeGreaterThanOrEqual(ColorLevel.NO_COLOR)
      })
    })

    describe('with empty TERM', () => {
      test.scoped({ env: { TERM: '' } })

      test('should handle gracefully', ({ detector }) => {
        expect(detector.getColorLevel()).toBeDefined()
      })
    })

    test('should handle missing env entirely', ({ detector }) => {
      expect(detector.getColorLevel()).toBeDefined()
    })
  })
})
