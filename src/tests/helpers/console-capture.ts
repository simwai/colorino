import { fromPromise, fromThrowable, ok, err, Result } from 'neverthrow'
import type { ConsoleMethod } from '../../types.js'
import { format } from 'node:util'

export interface BothResult {
  stdout: string
  stderr: string
}

export interface CaptureResult {
  output: string
  error?: unknown
}

export function captureStdout(
  fn: () => unknown
): Promise<Result<string, unknown>> {
  return _capture(fn, ['log', 'info', 'debug', 'trace'])
}

export function captureStderr(
  fn: () => unknown
): Promise<Result<string, unknown>> {
  return _capture(fn, ['error', 'warn'])
}

export async function captureBoth(
  fn: () => unknown
): Promise<Result<BothResult, unknown>> {
  const stdoutResult = await _capture(fn, ['log', 'info', 'debug', 'trace'])
  if (stdoutResult.isErr()) {
    return err(stdoutResult.error)
  }

  const stderrResult = await _capture(fn, ['error', 'warn'])
  if (stderrResult.isErr()) {
    return err(stderrResult.error)
  }

  return ok({
    stdout: stdoutResult.value,
    stderr: stderrResult.value,
  })
}

export async function captureOutputAndError(
  fn: () => unknown
): Promise<CaptureResult> {
  const result = await _capture(fn, [
    'log',
    'info',
    'debug',
    'trace',
    'error',
    'warn',
  ])

  if (result.isErr()) {
    return {
      output: '',
      error: result.error,
    }
  }

  return {
    output: result.value,
  }
}

async function _capture(
  fn: () => unknown,
  methods: ConsoleMethod[]
): Promise<Result<string, unknown>> {
  const outputs: string[] = []
  const originalMethods: Partial<Record<ConsoleMethod, any>> = {}

  for (const method of methods) {
    originalMethods[method] = console[method]
    console[method] = (...args: any[]) => {
      outputs.push(format(...args))
    }
  }

  const result = await fromPromise(
    Promise.resolve(fromThrowable(fn)()),
    error => error
  )

  for (const method of methods) {
    console[method] = originalMethods[method]
  }

  if (result.isErr()) {
    return err(result.error)
  }

  const capturedOutput = outputs.join('\n') + (outputs.length > 0 ? '\n' : '')
  return ok(capturedOutput)
}
