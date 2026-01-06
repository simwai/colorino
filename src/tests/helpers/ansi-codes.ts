export const ANSI = {
  // 256-color codes
  GREEN_256: '\u001B[38;5;46m',
  RED_256: '\u001B[38;5;196m',
  ORANGE_256: '\u001B[38;5;202m',

  // Basic ANSI codes
  GREEN_BASIC: '\u001B[92m',
  RED_BASIC: '\u001B[91m',

  // Truecolor codes
  GREEN_TRUE: '\u001B[38;2;0;255;0m',
  ORANGE_TRUE: '\u001B[38;2;255;87;51m',

  // Control codes
  RESET: '\u001B[0m',
} as const