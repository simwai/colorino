import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { TerminalTheme } from './types.js'

// @ts-ignore
const __dirname = dirname(fileURLToPath(import.meta.url))

let alreadyWarned = false
export function getTerminalThemeSync(
  areWarningsDisabled: boolean
): TerminalTheme {
  const maybeWarnUser = () => {
    if (alreadyWarned || areWarningsDisabled) return
    alreadyWarned = true
    console.warn(
      'Consider switching the console (Win: Terminal is best) or disabling oscProbe by adding disableOscProbe = true to the options passed into createColorino().'
    )
  }

  const scriptPath = join(__dirname, 'osc-child-probe.js')

  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: ['inherit', 'pipe', 'inherit'],
    encoding: 'utf8',
    timeout: 1500,
  })

  if (result.error || result.status !== 0) {
    maybeWarnUser()
    return 'unknown'
  }

  const output = result.stdout.trim()
  if (output === 'dark' || output === 'light') {
    return output
  }

  maybeWarnUser()
  return 'unknown'
}
