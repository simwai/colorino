import { describe, it, expect, test } from 'vitest'
import { colorConverter } from '../../color-converter.js'

describe('colorConverter - Node & Browser Environemnt - Unit Test', () => {
  describe('hex to...', () => {
    it('toRgb: should convert 3-digit hex to RGB', () => {
      expect(colorConverter.hex.toRgb('#f00')).toEqual([255, 0, 0])
    })
    it('toRgb: should convert 6-digit hex to RGB', () => {
      expect(colorConverter.hex.toRgb('#ff0000')).toEqual([255, 0, 0])
    })
    it('toRgb: should return black for invalid hex', () => {
      expect(colorConverter.hex.toRgb('invalid')).toEqual([0, 0, 0])
    })
    it('toAnsi16: should convert hex to ANSI 16', () => {
      expect(colorConverter.hex.toAnsi16('#ff0000')).toBe(91)
    })
    it('toAnsi256: should convert hex to ANSI 256', () => {
      expect(colorConverter.hex.toAnsi256('#ff0000')).toBe(196)
    })
  })

  describe('rgb to...', () => {
    it('toAnsi16: should convert RGB to ANSI 16', () => {
      expect(colorConverter.rgb.toAnsi16([255, 0, 0])).toBe(91)
    })
    it('toAnsi256: should convert RGB to ANSI 256', () => {
      expect(colorConverter.rgb.toAnsi256([255, 0, 0])).toBe(196)
    })
    it('toAnsi256: should correctly convert grayscale values', () => {
      expect(colorConverter.rgb.toAnsi256([0, 0, 0])).toBe(16) // black
      expect(colorConverter.rgb.toAnsi256([255, 255, 255])).toBe(231) // white
      expect(colorConverter.rgb.toAnsi256([128, 128, 128])).toBe(244) // gray
    })
  })

  describe('rgba to...', () => {
    it('toRgb: should convert RGBA to RGB', () => {
      expect(colorConverter.rgba.toRgb([255, 0, 0, 0.5])).toEqual([255, 0, 0])
    })
    it('toAnsi16: should convert RGBA to ANSI 16', () => {
      expect(colorConverter.rgba.toAnsi16([255, 0, 0, 0.5])).toBe(91)
    })
    it('toAnsi256: should convert RGBA to ANSI 256', () => {
      expect(colorConverter.rgba.toAnsi256([255, 0, 0, 0.5])).toBe(196)
    })
  })

  describe('hsl to...', () => {
    it('toAnsi16: should convert HSL to ANSI 16', () => {
      expect(colorConverter.hsl.toAnsi16([0, 100, 50])).toBe(91) // red
    })
    it('toAnsi256: should convert HSL to ANSI 256', () => {
      expect(colorConverter.hsl.toAnsi256([0, 100, 50])).toBe(196) // red
    })
  })

  describe('RGB Gradient Interpolation', () => {
    test('interpolates between two colors with 5 steps', () => {
      const result = colorConverter.hex.gradient('#ff0000', '#0000ff', 5)

      expect(result).toHaveLength(5)
      expect(result[0]).toEqual([255, 0, 0]) // Start: pure red
      expect(result[4]).toEqual([0, 0, 255]) // End: pure blue
      expect(result[2]).toEqual([128, 0, 128]) // Middle: purple
    })

    test('handles single step by returning start color', () => {
      const result = colorConverter.hex.gradient('#ff0000', '#0000ff', 1)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual([255, 0, 0])
    })

    test('handles two steps by returning start and end colors', () => {
      const result = colorConverter.hex.gradient('#ff0000', '#00ff00', 2)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual([255, 0, 0])
      expect(result[1]).toEqual([0, 255, 0])
    })

    test('interpolates grayscale gradients correctly', () => {
      const result = colorConverter.hex.gradient('#000000', '#ffffff', 3)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual([0, 0, 0])
      expect(result[1]).toEqual([128, 128, 128])
      expect(result[2]).toEqual([255, 255, 255])
    })

    test('handles identical start and end colors', () => {
      const result = colorConverter.hex.gradient('#ff5733', '#ff5733', 3)

      expect(result).toHaveLength(3)
      result.forEach(color => {
        expect(color).toEqual([255, 87, 51])
      })
    })
  })
})
