import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TypeValidator } from '../../type-validator.js'
export function getFilteredEnv(
  overrides: Record<string, string> = {}
): Record<string, string> {
  const filtered = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] =>
        !TypeValidator.isNullOrUndefined(entry[1])
    )
  )
  return { ...filtered, ...overrides }
}
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
export function getScriptPaths<T extends Record<string, string>>(
  currentFile: string,
  scripts: T
): { [K in keyof T]: string } {
  const __dirname = dirname(fileURLToPath(currentFile))
  return Object.fromEntries(
    Object.entries(scripts).map(([key, path]) => [key, join(__dirname, path)])
  ) as { [K in keyof T]: string }
}
export interface SpawnResult {
  stdout: string
  stderr: string
  exitCode: number | null
}
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
