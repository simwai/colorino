// windows-powershell-integration.spec.ts
import { test as base, describe, expect } from 'vitest'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface PowerShellIntegrationFixtures {
  scriptPaths: {
    testCmdColors: string
    testOscQuery: string
  }
  runInPowerShell: (
    scriptPath: string,
    env?: Record<string, string>
  ) => Promise<{
    stdout: string
    stderr: string
    exitCode: number | null
  }>
}

const test = base.extend<PowerShellIntegrationFixtures>({
  scriptPaths: async ({}, use) => {
    await use({
      testCmdColors: join(__dirname, '../helpers/test-cmd-colors.ts'),
      testOscQuery: join(__dirname, '../helpers/test-osc-query.ts'),
    })
  },

  runInPowerShell: async ({}, use) => {
    await use((scriptPath: string, env?: Record<string, string>) => {
      return new Promise(resolve => {
        const child = spawn(
          'powershell.exe',
          ['-NoProfile', '-Command', 'npx', 'tsx', scriptPath],
          {
            env: { ...process.env, ...env },
            stdio: ['inherit', 'pipe', 'pipe'],
          }
        )

        let stdout = ''
        let stderr = ''

        child.stdout?.on('data', chunk => (stdout += chunk.toString()))
        child.stderr?.on('data', chunk => (stderr += chunk.toString()))

        child.on('close', exitCode => {
          resolve({ stdout, stderr, exitCode })
        })
      })
    })
  },
})

describe('NodeColorSupportDetector - PowerShell - Integration Test', () => {
  test.skipIf(process.platform !== 'win32')(
    'should detect color support in PowerShell',
    async ({ runInPowerShell, scriptPaths }) => {
      const result = await runInPowerShell(scriptPaths.testCmdColors)

      expect(result.exitCode).toBe(0)
      const match = result.stdout.match(/ColorLevel:\s*(\d+)/)
      expect(match).toBeTruthy()
      expect(parseInt(match![1]!, 10)).toBeGreaterThanOrEqual(0)
      expect(result.stdout).toContain('Theme:')
    },
    10000
  )

  test.skipIf(process.platform !== 'win32' || !process.env['WT_SESSION'])(
    'should detect OSC 11 theme in Windows Terminal',
    async ({ runInPowerShell, scriptPaths }) => {
      const result = await runInPowerShell(scriptPaths.testOscQuery)

      expect(result.exitCode).toBe(0)
      expect(['dark', 'light']).toContain(result.stdout.trim())
    },
    10000
  )
})
