import {
  BrowserColorizedArg,
  BrowserCssArg,
  BrowserObjectArg,
  ColorinoBrowserColorized,
  ColorinoBrowserCss,
  ColorinoBrowserObject,
  ConsoleMethod,
} from './types.js'

// @__NO_SIDE_EFFECTS__
export function isNull(value: unknown): value is null {
  return value === null
}

// @__NO_SIDE_EFFECTS__
export function isUndefined(value: unknown): value is undefined {
  return value === undefined
}

// @__NO_SIDE_EFFECTS__
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value == null
}

// @__NO_SIDE_EFFECTS__
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// @__NO_SIDE_EFFECTS__
export function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String
}

// @__NO_SIDE_EFFECTS__
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

// @__NO_SIDE_EFFECTS__
export function isError(value: unknown): value is Error {
  return value instanceof Error
}

// @__NO_SIDE_EFFECTS__
export function isBrowserColorizedArg(
  value: unknown
): value is BrowserColorizedArg {
  return isObject(value) && ColorinoBrowserColorized in value
}

// @__NO_SIDE_EFFECTS__
export function isBrowserCssArg(value: unknown): value is BrowserCssArg {
  return (
    typeof value === 'object' &&
    value !== null &&
    ColorinoBrowserCss in value &&
    (value as BrowserCssArg)[ColorinoBrowserCss] === true
  )
}

// @__NO_SIDE_EFFECTS__
export function isBrowserObjectArg(value: unknown): value is BrowserObjectArg {
  return isObject(value) && ColorinoBrowserObject in value
}

// @__NO_SIDE_EFFECTS__
export function isAnsiColoredString(value: unknown): value is string {
  return (
    // eslint-disable-next-line no-control-regex
    isString(value) && /\x1b\[[0-9;]*m/.test(value.toString())
  )
}

// @__NO_SIDE_EFFECTS__
export function isFormattableObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    isObject(value) &&
    !isError(value) &&
    !isBrowserColorizedArg(value) &&
    !isString(value)
  )
}

// @__NO_SIDE_EFFECTS__
export function isStackLikeString(value: unknown): value is string {
  if (!isString(value)) return false

  const text = value.toString()
  if (!text.includes('\n')) return false

  const lines = text.split('\n').map(line => line.trim())
  let stackFrameLines = 0
  let hasErrorHeader = false

  for (const line of lines) {
    if (!line) continue

    if (!hasErrorHeader && line.includes('Error')) {
      hasErrorHeader = true
      continue
    }

    if (line.startsWith('at ')) {
      stackFrameLines++
    } else if (line.match(/:\d+:\d+\)?$/)) {
      stackFrameLines++
    }

    if (stackFrameLines >= 1) {
      return true
    }
  }

  return false
}

// @__NO_SIDE_EFFECTS__
export function isConsoleMethod(level: string): level is ConsoleMethod {
  return ['log', 'info', 'warn', 'error', 'trace', 'debug'].includes(level)
}
