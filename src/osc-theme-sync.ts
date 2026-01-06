import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { TerminalTheme } from './types.js'

// @ts-ignore
const __dirname = dirname(fileURLToPath(import.meta.url))

export function getTerminalThemeSync(): TerminalTheme {
  const scriptPath = join(__dirname, 'osc-child-probe.js')

  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: ['inherit', 'pipe', 'inherit'],
    encoding: 'utf8',
    timeout: 1500,
  })

  if (result.error || result.status !== 0) {
    return 'unknown'
  }

  const output = result.stdout.trim()
  if (output === 'dark' || output === 'light') {
    return output
  }

  return 'unknown'
}