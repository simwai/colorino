import type { HslColor, RgbaColor, RgbColor } from './types.js'

function hslToRgb(hsl: HslColor): RgbColor {
  const h = hsl[0] / 360
  const s = hsl[1] / 100
  const l = hsl[2] / 100
  let t1: number
  let t2: number
  const rgb: RgbColor = [0, 0, 0]

  if (s === 0) {
    const val = l * 255
    return [val, val, val]
  }

  t2 = l < 0.5 ? l * (1 + s) : l + s - l * s
  t1 = 2 * l - t2

  for (let i = 0; i < 3; i++) {
    let t3 = h + (1 / 3) * -(i - 1)
    if (t3 < 0) t3++
    if (t3 > 1) t3--

    let val: number
    if (6 * t3 < 1) {
      val = t1 + (t2 - t1) * 6 * t3
    } else if (2 * t3 < 1) {
      val = t2
    } else if (3 * t3 < 2) {
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6
    } else {
      val = t1
    }
    rgb[i] = val * 255
  }

  return rgb
}

function hexToRgb(hex: string): RgbColor {
  const match = hex.toString().match(/[a-f0-9]{6}|[a-f0-9]{3}/i)
  if (!match) {
    return [0, 0, 0]
  }

  let colorString = match[0]
  if (match[0].length === 3) {
    colorString = [...colorString].map(char => char + char).join('')
  }

  const integer = parseInt(colorString, 16)
  const r = (integer >> 16) & 0xff
  const g = (integer >> 8) & 0xff
  const b = integer & 0xff

  return [r, g, b]
}

function rgbaToRgb(rgba: RgbaColor): RgbColor {
  return [rgba[0], rgba[1], rgba[2]]
}

function rgbToAnsi256(rgb: RgbColor): number {
  const [r, g, b] = rgb
  if (r === g && g === b) {
    if (r < 8) return 16
    if (r > 248) return 231
    return Math.round(((r - 8) / 247) * 24) + 232
  }

  return (
    16 +
    36 * Math.round((r / 255) * 5) +
    6 * Math.round((g / 255) * 5) +
    Math.round((b / 255) * 5)
  )
}

function rgbToHsvValue(rgb: RgbColor): number {
  const r = rgb[0] / 255
  const g = rgb[1] / 255
  const b = rgb[2] / 255
  const v = Math.max(r, g, b)
  return v * 100
}

function rgbToAnsi16(rgb: RgbColor): number {
  const [r, g, b] = rgb
  const value = rgbToHsvValue(rgb)
  const roundedValue = Math.round(value / 50)

  if (roundedValue === 0) {
    return 30
  }

  let ansi =
    30 +
    ((Math.round(b / 255) << 2) |
      (Math.round(g / 255) << 1) |
      Math.round(r / 255))

  if (roundedValue === 2) {
    ansi += 60
  }

  return ansi
}

export const colorConverter = {
  hex: {
    toRgb: hexToRgb,
    toAnsi16: (hex: string) => rgbToAnsi16(hexToRgb(hex)),
    toAnsi256: (hex: string) => rgbToAnsi256(hexToRgb(hex)),
  },
  rgb: {
    toAnsi16: rgbToAnsi16,
    toAnsi256: rgbToAnsi256,
  },
  rgba: {
    toRgb: rgbaToRgb,
    toAnsi16: (rgba: RgbaColor) => rgbToAnsi16(rgbaToRgb(rgba)),
    toAnsi256: (rgba: RgbaColor) => rgbToAnsi256(rgbaToRgb(rgba)),
  },
  hsl: {
    toAnsi16: (hsl: HslColor) => rgbToAnsi16(hslToRgb(hsl)),
    toAnsi256: (hsl: HslColor) => rgbToAnsi256(hslToRgb(hsl)),
  },
}
