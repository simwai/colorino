import type { LogLevel } from './types.js'

export enum ColorLevel {
  NO_COLOR = 0,
  ANSI = 1,
  ANSI256 = 2,
  TRUECOLOR = 3,
}

export enum LogSeverity {
  TRACE = 0,
  DEBUG = 1,
  LOG = 2,
  INFO = 3,
  WARN = 4,
  ERROR = 5,
}

export const logSeverity: Record<LogLevel, LogSeverity> = {
  trace: LogSeverity.TRACE,
  debug: LogSeverity.DEBUG,
  log: LogSeverity.LOG,
  info: LogSeverity.INFO,
  warn: LogSeverity.WARN,
  error: LogSeverity.ERROR,
}
