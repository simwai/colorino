import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Type guard for filtering undefined values
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

// Shared env filtering with proper typing
export function getFilteredEnv(
  overrides: Record<string, string> = {}
): Record<string, string> {
  const filtered = Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] =>
      isDefined(entry[1])
    )
  )
  return { ...filtered, ...overrides }
}

// Centralized timeout constants
export const testTimeouts = {
  default: 3000,
  cmd: 10000,
  powerShell: 10000,
  pty: 20000,
  wait: 5000,
  waitInterval: 50,
  stdinDelay: 50,
  backslashEcho: 500,
  ptyCleanup: 1000,
  initialPrompt: 8000,
  exitCommand: 5000,
} as const

// Shared script paths helper - returns strongly typed object
export function getScriptPaths<T extends Record<string, string>>(
  currentFile: string,
  scripts: T
): { [K in keyof T]: string } {
  const __dirname = dirname(fileURLToPath(currentFile))
  return Object.fromEntries(
    Object.entries(scripts).map(([key, path]) => [key, join(__dirname, path)])
  ) as { [K in keyof T]: string }
}

// Common spawn result type
export interface SpawnResult {
  stdout: string
  stderr: string
  exitCode: number | null
}

// Generic spawn wrapper with error handling
export function spawnProcess(
  command: string,
  args: string[],
  options: {
    env?: Record<string, string>
    stdio?: Array<'pipe' | 'inherit'>
  } = {}
): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: getFilteredEnv(options.env),
      stdio: options.stdio ?? ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', chunk => {
      stdout += chunk.toString()
    })

    child.stderr?.on('data', chunk => {
      stderr += chunk.toString()
    })

    child.on('error', error => {
      reject(new Error(`Failed to spawn ${command}: ${error.message}`))
    })

    child.on('close', exitCode => {
      resolve({ stdout, stderr, exitCode })
    })
  })
}

// Specialized runner for Node scripts via tsx
export function runNodeScript(
  scriptPath: string,
  options: {
    env?: Record<string, string>
    stdinData?: string
    stdinDelay?: number
  } = {}
): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx/esm', scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: getFilteredEnv(options.env),
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', chunk => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', chunk => {
      stderr += chunk.toString()
    })

    child.on('error', error => {
      reject(new Error(`Failed to spawn process: ${error.message}`))
    })

    if (options.stdinData) {
      const delay = options.stdinDelay ?? testTimeouts.stdinDelay
      setTimeout(() => {
        child.stdin.write(options.stdinData!)
      }, delay)
    }

    child.on('close', exitCode => {
      resolve({ stdout, stderr, exitCode })
    })
  })
}

// Wait utility with exponential backoff
export async function waitFor(
  condition: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const timeoutMs = options.timeout ?? testTimeouts.wait
  const baseIntervalMs = options.interval ?? testTimeouts.waitInterval
  const startTime = Date.now()
  let currentInterval = baseIntervalMs

  while (true) {
    if (condition()) return

    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`waitFor timeout exceeded after ${timeoutMs}ms`)
    }

    await new Promise(resolve => setTimeout(resolve, currentInterval))
    currentInterval = Math.min(currentInterval * 1.5, 500)
  }
}

// Runtime capability check for node-pty
export async function canUseNodePty(): Promise<boolean> {
  try {
    await import('node-pty')
    return true
  } catch {
    return false
  }
}

// Conditional skip helper for node-pty tests
export async function skipIfNoPty(
  skip: (note?: string) => void
): Promise<void> {
  const hasPty = await canUseNodePty()
  if (!hasPty) {
    skip('node-pty not available (missing native dependencies)')
  }
}
