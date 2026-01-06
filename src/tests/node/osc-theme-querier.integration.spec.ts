import { test as base, describe, expect } from 'vitest'
import {
  getScriptPaths,
  runNodeScript,
  waitFor,
  skipIfNoPty,
  getFilteredEnv,
  testTimeouts,
  type SpawnResult,
} from '../helpers/integration.js'

const scriptPaths = getScriptPaths(import.meta.url, {
  testOscLeak: '../helpers/test-osc-leak.ts',
  testOscUserInput: '../helpers/test-osc-user-input.ts',
  testOscTimeout: '../helpers/test-osc-timeout.ts',
  manualTestCli: '../helpers/manual-test-cli.ts',
})

interface OscIntegrationFixtures {
  runNodeScript: (
    scriptPath: string,
    options?: {
      env?: Record<string, string>
      stdinData?: string
      stdinDelay?: number
    }
  ) => Promise<SpawnResult>
}

const test = base.extend<OscIntegrationFixtures>({
  // oxlint-disable-next-line no-empty-pattern
  runNodeScript: async ({}, use) => {
    await use(runNodeScript)
  },
})

describe('OSC theme detection - Real TTY - Integration Test', () => {
  test(
    'should not leak OSC bytes into stdout',
    async ({ runNodeScript }) => {
      const result = await runNodeScript(scriptPaths.testOscLeak, {
        env: { FORCE_COLOR: '0' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Done')
      // oxlint-disable-next-line no-control-regex
      expect(result.stdout).not.toMatch(/\x1b\]11/)
      expect(result.stdout).not.toMatch(/rgb:/)
      expect(result.stderr).toBe('')
    },
    testTimeouts.default
  )

  test(
    'should handle user input after probe without consuming it',
    async ({ runNodeScript }) => {
      const result = await runNodeScript(scriptPaths.testOscUserInput, {
        env: { FORCE_COLOR: '0' },
        stdinData: 'hello\n',
        stdinDelay: 100,
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('After probe')
      expect(result.stdout).toContain('Received: hello')
      expect(result.stderr).toBe('')
    },
    testTimeouts.default
  )

  test(
    'should timeout gracefully when terminal does not respond',
    async ({ runNodeScript }) => {
      const result = await runNodeScript(scriptPaths.testOscTimeout, {
        env: { FORCE_COLOR: '0' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Completed without crash')
      expect(result.stdout).toMatch(/Theme result: (dark|light|unknown)/)
      expect(result.stderr).toBe('')
    },
    testTimeouts.default
  )

  test(
    'manual-test-cli should not see OSC junk or crash on backslash',
    async ({ skip }) => {
      await skipIfNoPty(skip)

      const { spawn: ptySpawn } = await import('node-pty')

      const shell = ptySpawn(
        process.execPath,
        ['--import', 'tsx/esm', scriptPaths.manualTestCli],
        {
          name: 'xterm-256color',
          cols: 80,
          rows: 30,
          cwd: process.cwd(),
          env: getFilteredEnv({ FORCE_COLOR: '0' }),
        }
      )

      let stdout = ''
      let exited = false

      shell.onData(data => {
        stdout += data
      })

      shell.onExit(() => {
        exited = true
      })

      try {
        await waitFor(() => stdout.includes('utils-cli$ (theme:'), {
          timeout: testTimeouts.initialPrompt,
        })

        shell.write('\\\r')
        await new Promise(resolve =>
          setTimeout(resolve, testTimeouts.backslashEcho)
        )

        expect(stdout).not.toContain('Prompt error')
        expect(stdout).not.toContain('User force closed the prompt')
        expect(stdout).not.toContain('SIGINT')
        expect(stdout).toContain('Echo: \\')

        shell.write('exit\r')
        await waitFor(() => exited, { timeout: testTimeouts.exitCommand })
      } finally {
        if (!exited) {
          shell.kill()
          await waitFor(() => exited, {
            timeout: testTimeouts.ptyCleanup,
          }).catch(() => {
            console.warn('⚠️  PTY process cleanup timed out, may leak')
          })
        }
      }
    },
    testTimeouts.pty
  )
})