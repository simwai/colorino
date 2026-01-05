import { test as base, describe, expect } from 'vitest'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pty from 'node-pty'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function waitFor(
  condition: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const timeoutMs = options.timeout ?? 5000
  const intervalMs = options.interval ?? 50
  const startTime = Date.now()
  while (true) {
    if (condition()) return
    if (Date.now() - startTime > timeoutMs) {
      throw new Error('waitFor timeout exceeded')
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
}

interface OscIntegrationFixtures {
  scriptPaths: {
    testOscLeak: string
    testOscUserInput: string
    testOscTimeout: string
    manualTestCli: string
  }
  runNodeScript: (
    scriptPath: string,
    options?: {
      env?: Record<string, string>
      stdinData?: string
      stdinDelay?: number
    }
  ) => Promise<{
    stdout: string
    stderr: string
    exitCode: number | null
  }>
}

const test = base.extend<OscIntegrationFixtures>({
  // eslint-disable-next-line no-empty-pattern
  scriptPaths: async ({}, use) => {
    await use({
      testOscLeak: join(__dirname, '../helpers/test-osc-leak.ts'),
      testOscUserInput: join(__dirname, '../helpers/test-osc-user-input.ts'),
      testOscTimeout: join(__dirname, '../helpers/test-osc-timeout.ts'),
      manualTestCli: join(__dirname, '../helpers/manual-test-cli.ts'),
    })
  },
  // eslint-disable-next-line no-empty-pattern
  runNodeScript: async ({}, use) => {
    await use((scriptPath: string, options = {}) => {
      return new Promise(resolve => {
        const child = spawn(
          process.execPath,
          ['--import', 'tsx/esm', scriptPath],
          {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, ...options.env },
          }
        )

        let stdout = ''
        let stderr = ''

        child.stdout.on('data', chunk => (stdout += chunk.toString()))
        child.stderr.on('data', chunk => (stderr += chunk.toString()))

        if (options.stdinData) {
          setTimeout(() => {
            child.stdin.write(options.stdinData!)
          }, options.stdinDelay ?? 50)
        }

        child.on('close', exitCode => {
          resolve({ stdout, stderr, exitCode })
        })
      })
    })
  },
})

describe('OSC theme detection - Real TTY - Integration Test', () => {
  test('should not leak OSC bytes into stdout', async ({
    runNodeScript,
    scriptPaths,
  }) => {
    const result = await runNodeScript(scriptPaths.testOscLeak, {
      env: { FORCE_COLOR: '0' },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Done')
    // oxlint-disable-next-line no-control-regex
    expect(result.stdout).not.toMatch(/\x1b\]11/)
    expect(result.stdout).not.toMatch(/rgb:/)
    expect(result.stderr).toBe('')
  }, 3000)

  test('should handle user input after probe without consuming it', async ({
    runNodeScript,
    scriptPaths,
  }) => {
    const result = await runNodeScript(scriptPaths.testOscUserInput, {
      env: { FORCE_COLOR: '0' },
      stdinData: 'hello\n',
      stdinDelay: 100,
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('After probe')
    expect(result.stdout).toContain('Received: hello')
    expect(result.stderr).toBe('')
  }, 3000)

  test('should timeout gracefully when terminal does not respond', async ({
    runNodeScript,
    scriptPaths,
  }) => {
    const result = await runNodeScript(scriptPaths.testOscTimeout, {
      env: { FORCE_COLOR: '0' },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Completed without crash')
    expect(result.stdout).toMatch(/Theme result: (dark|light|unknown)/)
    expect(result.stderr).toBe('')
  }, 3000)

  test('manual-test-cli should not see OSC junk or crash on backslash', async ({
    scriptPaths,
  }) => {
    const shell = pty.spawn(
      process.execPath,
      ['--import', 'tsx/esm', scriptPaths.manualTestCli],
      {
        name: 'xterm-256color',
        cols: 80,
        rows: 30,
        cwd: process.cwd(),
        env: {
          ...process.env,
          FORCE_COLOR: '0',
        } as Record<string, string>,
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
      // Wait until the initial prompt with theme appears
      await waitFor(() => stdout.includes('utils-cli$ (theme:'), {
        timeout: 8000,
      })

      // Send a backslash + Enter
      shell.write('\\\r')
      await new Promise(resolve => setTimeout(resolve, 500))

      // Assertions: no crash markers, backslash echoed
      expect(stdout).not.toContain('Prompt error')
      expect(stdout).not.toContain('User force closed the prompt')
      expect(stdout).not.toContain('SIGINT')
      expect(stdout).toContain('Echo: \\')

      shell.write('exit\r')
      await waitFor(() => exited, { timeout: 5000 })
    } finally {
      if (!exited) {
        shell.kill()
      }
    }
  }, 20000)
})
