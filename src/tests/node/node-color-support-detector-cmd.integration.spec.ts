// windows-cmd-integration.spec.ts
import { test as base, describe, expect } from 'vitest'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface CmdIntegrationFixtures {
  scriptPaths: {
    testCmdColors: string
    testOscQuery: string
  }
  runInCmd: (
    scriptPath: string,
    env?: Record<string, string>
  ) => Promise<{
    stdout: string
    stderr: string
    exitCode: number | null
  }>
}

const test = base.extend<CmdIntegrationFixtures>({
  scriptPaths: async ({}, use) => {
    await use({
      testCmdColors: join(__dirname, '../helpers/test-cmd-colors.ts'),
      testOscQuery: join(__dirname, '../helpers/test-osc-query.ts'),
    })
  },

  runInCmd: async ({}, use) => {
    await use((scriptPath: string, env?: Record<string, string>) => {
      return new Promise(resolve => {
        const child = spawn('cmd.exe', ['/c', 'npx', 'tsx', scriptPath], {
          env: { ...process.env, ...env },
          stdio: ['inherit', 'pipe', 'pipe'],
        })

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

describe('NodeColorSupportDetector - Windows CMD - Integration Test', () => {
  test.skipIf(process.platform !== 'win32')(
    'should detect color support in cmd.exe',
    async ({ runInCmd, scriptPaths }) => {
      const result = await runInCmd(scriptPaths.testCmdColors)

      expect(result.exitCode).toBe(0)

      // Parse actual values
      const colorLevelMatch = result.stdout.match(/ColorLevel:\s*(\d+)/)
      const themeMatch = result.stdout.match(/Theme:\s*(\w+)/)

      expect(colorLevelMatch).toBeTruthy()
      expect(themeMatch).toBeTruthy()

      const colorLevel = parseInt(colorLevelMatch![1]!, 10)
      expect(colorLevel).toBeGreaterThanOrEqual(0)
      expect(colorLevel).toBeLessThanOrEqual(3)

      const theme = themeMatch![1]!
      expect(['dark', 'light', 'unknown']).toContain(theme)
    },
    10000
  )

  test.skipIf(process.platform !== 'win32')(
    'should respect FORCE_COLOR=1 in cmd.exe',
    async ({ runInCmd, scriptPaths }) => {
      const result = await runInCmd(scriptPaths.testCmdColors, {
        FORCE_COLOR: '1',
      })

      expect(result.exitCode).toBe(0)
      // Strip ANSI codes: \x1b[...m
      // eslint-disable-next-line no-control-regex
      const cleanStdout = result.stdout.replace(/\x1b\[\d+m/g, '')
      expect(cleanStdout).toContain('ColorLevel: 1') // ANSI
    },
    10000
  )
})
