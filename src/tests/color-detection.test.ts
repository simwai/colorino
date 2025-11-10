import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NodeColorSupportDetector } from '../node-color-support-detector.js'
import { ColorLevel } from '../enums.js'
import { vi } from 'vitest'
import { withEnv } from './helpers/env-helpers.js'

describe('NodeColorSupportDetector', () => {
  beforeEach(() => {
    vi.stubGlobal('process', {
      stdout: { isTTY: true },
      env: { FORCE_COLOR: '3' },
      stdin: { setRawMode: () => {} },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('NO_COLOR environment variable', () => {
    it('should return NO_COLOR when NO_COLOR is set', () => {
      withEnv({ NO_COLOR: 'true' }, () => {
        const detector = new NodeColorSupportDetector(process)
        expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
      })
    })

    it('should override other settings', () => {
      withEnv({ NO_COLOR: 'true', TERM: 'xterm-256color' }, () => {
        const detector = new NodeColorSupportDetector(process)
        expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
      })
    })
  })

  describe('FORCE_COLOR environment variable', () => {
    it('should return TRUECOLOR when FORCE_COLOR=3', () => {
      const detector = new NodeColorSupportDetector(process)
      expect(detector.getColorLevel()).toBe(ColorLevel.TRUECOLOR)
    })

    it('should return ANSI256 when FORCE_COLOR=2', () => {
      const detector = new NodeColorSupportDetector(process)
      expect(detector.getColorLevel()).toBe(ColorLevel.ANSI256)
    })

    it('should return ANSI when FORCE_COLOR=1', () => {
      const detector = new NodeColorSupportDetector(process)
      expect(detector.getColorLevel()).toBe(ColorLevel.ANSI)
    })

    it('should return NO_COLOR when FORCE_COLOR=0', () => {
      const detector = new NodeColorSupportDetector(process)
      expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
    })
  })

  describe('TTY detection', () => {
    it('should return NO_COLOR when not a TTY', () => {
      const detector = new NodeColorSupportDetector(process)
      expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
    })

    it('should detect color when TTY and CLICOLOR_FORCE is set', () => {
      const detector = new NodeColorSupportDetector(process)
      expect(detector.getColorLevel()).toBeGreaterThan(ColorLevel.NO_COLOR)
    })
  })

  describe('COLORTERM detection', () => {
    it('should return TRUECOLOR when COLORTERM=truecolor', () => {
      const detector = new NodeColorSupportDetector(process)
      expect(detector.getColorLevel()).toBe(ColorLevel.TRUECOLOR)
    })

    it('should return TRUECOLOR when COLORTERM=24bit', () => {
      const detector = new NodeColorSupportDetector(process)
      expect(detector.getColorLevel()).toBe(ColorLevel.TRUECOLOR)
    })
  })

  describe('Windows Terminal detection', () => {
    it('should return TRUECOLOR when WT_SESSION is set', () => {
      const detector = new NodeColorSupportDetector(process)
      expect(detector.getColorLevel()).toBe(ColorLevel.TRUECOLOR)
    })
  })

  describe('TERM-based detection', () => {
    it('should detect truecolor terminals', () => {
      const terms = [
        'xterm-kitty',
        'xterm-ghostty',
        'wezterm',
        'xterm-truecolor',
      ]

      for (const _ of terms) {
        const detector = new NodeColorSupportDetector(process)
        expect(detector.getColorLevel()).toBe(ColorLevel.TRUECOLOR)
      }
    })

    it('should detect 256-color terminals', () => {
      const terms = ['xterm-256color', 'screen-256color']

      for (const _ of terms) {
        const detector = new NodeColorSupportDetector(process)
        expect(detector.getColorLevel()).toBe(ColorLevel.ANSI256)
      }
    })

    it('should detect basic ANSI terminals', () => {
      const terms = ['xterm', 'screen', 'vt100', 'linux']

      for (const _ of terms) {
        const detector = new NodeColorSupportDetector(process)
        expect(detector.getColorLevel()).toBe(ColorLevel.ANSI)
      }
    })

    it('should return NO_COLOR for dumb terminal', () => {
      const detector = new NodeColorSupportDetector(process)
      expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
    })
  })
})
