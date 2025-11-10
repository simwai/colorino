/**
 * Environment Variable Helpers
 *
 * WHY: Tests shouldn't pollute global process.env state.
 * These helpers ensure clean isolation between tests.
 */

/**
 * Executes function with temporary environment variables
 * Automatically restores original state afterward
 */
export function withEnv<T>(
  env: Record<string, string | undefined>,
  fn: () => T
): T {
  const original: Record<string, string | undefined> = {}

  // Save original values
  for (const key of Object.keys(env)) {
    original[key] = process.env[key]
  }

  // Set new values (undefined = delete)
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  try {
    return fn()
  } finally {
    // Restore original state
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

/**
 * Preset environments for common test scenarios
 */
export const ENV_PRESETS = {
  // Force truecolor support
  TRUECOLOR: {
    FORCE_COLOR: '3',
    NO_COLOR: undefined,
  },

  // Force 256 color support
  ANSI256: {
    FORCE_COLOR: '2',
    NO_COLOR: undefined,
  },

  // Force basic ANSI support
  ANSI: {
    FORCE_COLOR: '1',
    NO_COLOR: undefined,
  },

  // Disable all colors
  NO_COLOR: {
    NO_COLOR: '1',
    FORCE_COLOR: undefined,
  },

  // Simulate typical CI environment
  CI: {
    CI: 'true',
    NO_COLOR: undefined,
    FORCE_COLOR: undefined,
  },
} as const
