import { describe, it, expect } from 'vitest'
import { withEnv, ENV_PRESETS } from './helpers/env-helpers.js'
import { ColorLevel } from '../enums.js'
import { NodeColorSupportDetector } from '../node-color-support-detector.js'

describe('NodeColorSupportDetector', () => {
  describe('NO_COLOR environment variable', () => {
    it('should return NO_COLOR when NO_COLOR is set', () => {
      withEnv({ NO_COLOR: '1' }, () => {
        const detector = new NodeColorSupportDetector(process)
        expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
      })
    })

    it('should override other settings', () => {
      withEnv({ NO_COLOR: '1', FORCE_COLOR: '3' }, () => {
        const detector = new NodeColorSupportDetector(process)
        expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
      })
    })
  })

  describe('FORCE_COLOR environment variable', () => {
    it('should return TRUECOLOR when FORCE_COLOR=3', () => {
      withEnv(ENV_PRESETS.TRUECOLOR, () => {
        const detector = new NodeColorSupportDetector(process)
        expect(detector.getColorLevel()).toBe(ColorLevel.TRUECOLOR)
      })
    })

    it('should return ANSI256 when FORCE_COLOR=2', () => {
      withEnv(ENV_PRESETS.ANSI256, () => {
        const detector = new NodeColorSupportDetector(process)
        expect(detector.getColorLevel()).toBe(ColorLevel.ANSI256)
      })
    })

    it('should return ANSI when FORCE_COLOR=1', () => {
      withEnv(ENV_PRESETS.ANSI, () => {
        const detector = new NodeColorSupportDetector(process)
        expect(detector.getColorLevel()).toBe(ColorLevel.ANSI)
      })
    })

    it('should return NO_COLOR when FORCE_COLOR=0', () => {
      withEnv({ FORCE_COLOR: '0' }, () => {
        const detector = new NodeColorSupportDetector(process)
        expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
      })
    })
  })

  describe('TTY detection', () => {
    it('should return NO_COLOR when not a TTY', () => {
      withEnv({}, () => {
        // Here we can't use the process global, we must mock it
        const mockProcess = {
          env: {},
          stdout: { isTTY: false }, // Explicitly not a TTY
          stdin: { setRawMode: () => {} },
        }
        const detector = new NodeColorSupportDetector(mockProcess as any)
        expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
      })
    })

    it('should detect color when TTY and CLICOLOR_FORCE is set', () => {
      withEnv({ CLICOLOR_FORCE: '1' }, () => {
        const mockProcess = {
          env: { CLICOLOR_FORCE: '1' },
          stdout: { isTTY: false }, // Force should override this
          stdin: { setRawMode: () => {} },
        }
        const detector = new NodeColorSupportDetector(mockProcess as any)
        expect(detector.getColorLevel()).toBe(ColorLevel.ANSI) // Basic ANSI is the fallback
      })
    })
  })

  // The rest of the tests follow the same `withEnv` pattern...
  describe('TERM-based detection', () => {
    it('should detect 256-color terminals', () => {
      withEnv({ TERM: 'xterm-256color' }, () => {
        const detector = new NodeColorSupportDetector(process)
        expect(detector.getColorLevel()).toBe(ColorLevel.ANSI256)
      })
    })

    it('should detect basic ANSI terminals', () => {
      withEnv({ TERM: 'xterm' }, () => {
        const detector = new NodeColorSupportDetector(process)
        expect(detector.getColorLevel()).toBe(ColorLevel.ANSI)
      })
    })

    it('should return NO_COLOR for dumb terminal', () => {
      withEnv({ TERM: 'dumb' }, () => {
        const detector = new NodeColorSupportDetector(process)
        expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
      })
    })
  })
})
