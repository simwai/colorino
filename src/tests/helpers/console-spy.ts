import util from 'node:util'
import { vi, test as base } from 'vitest'
import { ConsoleMethod } from '../../types.js'
import { createColorino } from '../../node.js'
import { createTestPalette } from './palette.js'

type ConsoleMethodName = keyof Pick<
  Console,
  'log' | 'info' | 'debug' | 'warn' | 'error' | 'trace'
>

export interface SpyConsoleOptions {
  callThrough: boolean
  onCall?: (parameters: unknown[]) => void
}

export interface ColorinoFixtures {
  stdoutSpy: {
    getOutput: () => string
  }
  stderrSpy: {
    getOutput: () => string
  }
  logger: ReturnType<typeof createColorino>
  env: Record<string, string>
}

export function spyConsoleMethod(
  methodName: ConsoleMethodName,
  options: SpyConsoleOptions
) {
  const originalMethod = (
    console[methodName] as (...parameters: unknown[]) => void
  ).bind(console)

  const capturedCalls: unknown[][] = []

  const spy = vi
    .spyOn(console, methodName)
    .mockImplementation((...parameters: unknown[]) => {
      capturedCalls.push(parameters)
      options.onCall?.(parameters)
      if (options.callThrough) {
        originalMethod(...parameters)
      }
    })

  return {
    spy,
    getCalls: () => capturedCalls,
    restore: () => spy.mockRestore(),
  }
}

export function stringifyConsoleParameter(parameter: unknown): string {
  if (typeof parameter === 'string') {
    return parameter
  }

  return util.inspect(parameter)
}

export function stringifyConsoleLine(
  parameters: unknown[],
  prefix?: string
): string {
  const parts: string[] = []

  if (prefix !== undefined) {
    parts.push(prefix)
  }

  for (const parameter of parameters) {
    parts.push(stringifyConsoleParameter(parameter))
  }

  return `${parts.join(' ')}\n`
}

const methodsToStdoutSpy: ConsoleMethod[] = ['log', 'info', 'debug', 'trace']
const methodsToStderrSpy: ConsoleMethod[] = ['warn', 'error']

export const test = base.extend<ColorinoFixtures>({
  // eslint-disable-next-line
  stdoutSpy: async ({}, use) => {
    const chunks: string[] = []
    const callThrough = true

    const spyInstances = methodsToStdoutSpy.map(method => {
      return spyConsoleMethod(method, {
        callThrough,
        onCall: (parameters: unknown[]) => {
          chunks.push(stringifyConsoleLine(parameters))
        },
      })
    })

    await use({
      getOutput: () => chunks.join(''),
    })

    for (const spyInstance of spyInstances) {
      spyInstance.restore()
    }
  },

  // eslint-disable-next-line
  stderrSpy: async ({}, use) => {
    const chunks: string[] = []
    const callThrough = true

    const spyInstances = methodsToStderrSpy.map(method => {
      return spyConsoleMethod(method, {
        callThrough,
        onCall: (parameters: unknown[]) => {
          chunks.push(stringifyConsoleLine(parameters))
        },
      })
    })

    await use({
      getOutput: () => chunks.join(''),
    })

    for (const spyInstance of spyInstances) {
      spyInstance.restore()
    }
  },

  // eslint-disable-next-line
  logger: async ({}, use) => {
    await use(
      createColorino(createTestPalette(), {
        disableWarnings: true,
      })
    )
  },

  env: [{}, { injected: true }],
})