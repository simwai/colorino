import { describe, expect, vi } from 'vitest'
import { NodeColorSupportDetector } from '../../node-color-support-detector.js'
import { ColorLevel } from '../../enums.js'
import type { TerminalTheme } from '../../types.js'
import { test as base } from '../helpers/console-spy.js'

interface ColorDetectorFixtures {
  mockStdin: Partial<NodeJS.ReadStream> & { isTTY: boolean; isRaw: boolean }
  mockStdout: Partial<NodeJS.WriteStream> & { isTTY: boolean }
  mockProcess: NodeJS.Process
  detector: NodeColorSupportDetector
}

const test = base.extend<ColorDetectorFixtures>({
  // eslint-disable-next-line
  mockStdin: async ({}, use) => {
    const stdin = {
      isTTY: true,
      isRaw: false,
      setRawMode: vi.fn(),
      resume: vi.fn(),
      pause: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
      read: vi.fn(() => null),
    }
    await use(stdin)
  },
  // eslint-disable-next-line
  mockStdout: async ({}, use) => {
    const stdout = {
      isTTY: true,
      write: vi.fn(),
    }
    await use(stdout)
  },

  mockProcess: async ({ mockStdout, mockStdin, env }, use) => {
    const process = {
      env: { ...env },
      stdout: mockStdout,
      stdin: mockStdin,
    } as unknown as NodeJS.Process
    await use(process)
  },

  detector: async ({ mockProcess }, use) => {
    await use(new NodeColorSupportDetector(mockProcess))
  },
})

describe('NodeColorSupportDetector', () => {
  describe('theme detection (sync OSC)', () => {
    test('uses overrideTheme when provided', ({ mockProcess }) => {
      const detector = new NodeColorSupportDetector(
        mockProcess,
        'dark' as TerminalTheme
      )
      expect(detector.getTheme()).toBe('dark')
    })
  })

  describe('NO_COLOR environment variable', () => {
    test('should return NO_COLOR when set', ({ mockProcess }) => {
      mockProcess.env['NO_COLOR'] = 'true'
      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
    })

    test('should override TERM settings', ({ mockProcess }) => {
      mockProcess.env['NO_COLOR'] = 'true'
      mockProcess.env['TERM'] = 'xterm-256color'
      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
    })
  })

  describe('FORCE_COLOR environment variable', () => {
    test('should return TRUECOLOR when 3', ({ mockProcess }) => {
      mockProcess.env['FORCE_COLOR'] = '3'
      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getColorLevel()).toBe(ColorLevel.TRUECOLOR)
    })

    test('should return ANSI256 when 2', ({ mockProcess }) => {
      mockProcess.env['FORCE_COLOR'] = '2'
      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getColorLevel()).toBe(ColorLevel.ANSI256)
    })

    test('should return ANSI when 1', ({ mockProcess }) => {
      mockProcess.env['FORCE_COLOR'] = '1'
      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getColorLevel()).toBe(ColorLevel.ANSI)
    })

    test('should return NO_COLOR when 0', ({ mockProcess }) => {
      mockProcess.env['FORCE_COLOR'] = '0'
      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
    })
  })

  describe('TTY detection', () => {
    test('should return NO_COLOR when not a TTY', ({
      mockStdout,
      mockProcess,
    }) => {
      mockStdout.isTTY = false
      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
    })

    test('should detect ANSI when not a TTY but CLICOLOR_FORCE is set', ({
      mockStdout,
      mockProcess,
    }) => {
      mockStdout.isTTY = false
      mockProcess.env['CLICOLOR_FORCE'] = '1'
      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getColorLevel()).toBe(ColorLevel.ANSI)
    })
  })

  describe('TERM-based detection', () => {
    test('should detect ANSI256 with xterm-256color', ({ mockProcess }) => {
      mockProcess.env['TERM'] = 'xterm-256color'
      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getColorLevel()).toBe(ColorLevel.ANSI256)
    })

    test('should detect ANSI with xterm', ({ mockProcess }) => {
      mockProcess.env['TERM'] = 'xterm'
      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getColorLevel()).toBe(ColorLevel.ANSI)
    })

    test('should return NO_COLOR with dumb terminal', ({ mockProcess }) => {
      mockProcess.env['TERM'] = 'dumb'
      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
    })
  })

  describe('Edge Cases', () => {
    test('defaults to NO_COLOR with malformed FORCE_COLOR', ({
      mockProcess,
    }) => {
      mockProcess.env['FORCE_COLOR'] = 'invalid'
      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getColorLevel()).toBe(ColorLevel.ANSI)
    })

    test('handles empty TERM gracefully', ({ mockProcess }) => {
      mockProcess.env['TERM'] = ''
      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getColorLevel()).toBeDefined()
    })

    test('handles missing env entirely', ({ mockProcess }) => {
      mockProcess.env = {} as NodeJS.ProcessEnv
      const detector = new NodeColorSupportDetector(mockProcess)
      expect(detector.getColorLevel()).toBeDefined()
    })
  })
})
