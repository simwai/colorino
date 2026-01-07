import { test as base, describe, expect } from 'vitest'
import {
  getScriptPaths,
  spawnProcess,
  testTimeouts,
  type SpawnResult,
} from '../helpers/integration.js'

const scriptPaths = getScriptPaths(import.meta.url, {
  testCmdColors: '../helpers/test-cmd-colors.ts',
  testOscQuery: '../helpers/test-osc-query.ts',
})

interface CmdIntegrationFixtures {
  runInCmd: (
    scriptPath: string,
    env?: Record<string, string>
  ) => Promise<SpawnResult>
}

const test = base.extend<CmdIntegrationFixtures>({
  // eslint-disable-next-line
  runInCmd: async ({}, use) => {
    await use((scriptPath: string, env?: Record<string, string>) => {
      return spawnProcess('cmd.exe', ['/c', 'npx', 'tsx', scriptPath], {
        env,
        stdio: ['inherit', 'pipe', 'pipe'],
      })
    })
  },
})

describe('NodeColorSupportDetector - Windows CMD - Integration Test', () => {
  test.skipIf(process.platform !== 'win32')(
    'should detect color support in cmd.exe',
    async ({ runInCmd }) => {
      const result = await runInCmd(scriptPaths.testCmdColors)

      expect(result.exitCode).toBe(0)

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
    testTimeouts.cmd
  )

  test.skipIf(process.platform !== 'win32')(
    'should respect FORCE_COLOR=1 in cmd.exe',
    async ({ runInCmd }) => {
      const result = await runInCmd(scriptPaths.testCmdColors, {
        FORCE_COLOR: '1',
      })

      expect(result.exitCode).toBe(0)
      // eslint-disable-next-line no-control-regex
      const cleanStdout = result.stdout.replace(/\x1b\[\d+m/g, '')
      expect(cleanStdout).toContain('ColorLevel: 1')
    },
    testTimeouts.cmd
  )
})
