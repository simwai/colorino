import { describe, it, expect } from 'vitest'
import { NodeColorSupportDetector } from '../../node-color-support-detector.js'
import { ColorLevel } from '../../enums.js'
const createDetector = (
  env: NodeJS.ProcessEnv = {},
  isTTY = true,
) => {
  const mockProcess = {
    env,
    stdout: { isTTY },
    stdin: { setRawMode: () => {} },
  }
  return new NodeColorSupportDetector(mockProcess as any)
}

describe('NodeColorSupportDetector - Node Environment - Unit Test', () => {
  describe('NO_COLOR environment variable', () => {
    it('should return NO_COLOR when NO_COLOR is set', () => {
      const detector = createDetector({ NO_COLOR: 'true' })
      expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
    })

    it('should override other settings', () => {
      const detector = createDetector({
        NO_COLOR: 'true',
        TERM: 'xterm-256color',
      })
      expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
    })
  })

  describe('FORCE_COLOR environment variable', () => {
    it('should return TRUECOLOR when FORCE_COLOR=3', () => {
      const detector = createDetector({ FORCE_COLOR: '3' })
      expect(detector.getColorLevel()).toBe(ColorLevel.TRUECOLOR)
    })

    it('should return ANSI256 when FORCE_COLOR=2', () => {
      const detector = createDetector({ FORCE_COLOR: '2' })
      expect(detector.getColorLevel()).toBe(ColorLevel.ANSI256)
    })

    it('should return ANSI when FORCE_COLOR=1', () => {
      const detector = createDetector({ FORCE_COLOR: '1' })
      expect(detector.getColorLevel()).toBe(ColorLevel.ANSI)
    })

    it('should return NO_COLOR when FORCE_COLOR=0', () => {
      const detector = createDetector({ FORCE_COLOR: '0' })
      expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
    })
  })

  describe('TTY detection', () => {
    it('should return NO_COLOR when not a TTY', () => {
      const detector = createDetector({}, false)
      expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
    })

    it('should detect color when not a TTY but CLICOLOR_FORCE is set', () => {
      const detector = createDetector({ CLICOLOR_FORCE: '1' }, false)
      expect(detector.getColorLevel()).toBe(ColorLevel.ANSI)
    })
  })

  describe('TERM-based detection', () => {
    it('should detect 256-color terminals', () => {
      const detector = createDetector({ TERM: 'xterm-256color' })
      expect(detector.getColorLevel()).toBe(ColorLevel.ANSI256)
    })

    it('should detect basic ANSI terminals', () => {
      const detector = createDetector({ TERM: 'xterm' })
      expect(detector.getColorLevel()).toBe(ColorLevel.ANSI)
    })

    it('should return NO_COLOR for dumb terminal', () => {
      const detector = createDetector({ TERM: 'dumb' })
      expect(detector.getColorLevel()).toBe(ColorLevel.NO_COLOR)
    })
  })
})
