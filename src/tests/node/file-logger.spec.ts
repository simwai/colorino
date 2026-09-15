import { describe, expect, test, afterAll } from 'vitest'
import { ColorinoFileLogger } from '../../file-logger.js'
import { InputValidator } from '../../input-validator.js'
import { InputValidationError } from '../../errors.js'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('ColorinoFileLogger validation', () => {
  const directory = mkdtempSync(join(tmpdir(), 'colorino-file-logger-'))
  const validator = new InputValidator()

  test('throws InputValidationError when path is empty', () => {
    expect(() => new ColorinoFileLogger({ path: '' }, validator)).toThrow(
      InputValidationError
    )
  })

  test('throws InputValidationError when maxBytes is not positive', () => {
    expect(
      () =>
        new ColorinoFileLogger(
          { path: join(directory, 'a.log'), maxBytes: 0 },
          validator
        )
    ).toThrow(InputValidationError)
  })

  test('throws InputValidationError when maxFiles is not positive', () => {
    expect(
      () =>
        new ColorinoFileLogger(
          { path: join(directory, 'a.log'), maxFiles: 0 },
          validator
        )
    ).toThrow(InputValidationError)
  })

  test('preserves existing validation messages', () => {
    expect(() => new ColorinoFileLogger({ path: '   ' }, validator)).toThrow(
      'File logging path cannot be empty'
    )
    expect(
      () =>
        new ColorinoFileLogger(
          { path: join(directory, 'a.log'), maxBytes: -1 },
          validator
        )
    ).toThrow('File logging maxBytes must be positive')
    expect(
      () =>
        new ColorinoFileLogger(
          { path: join(directory, 'a.log'), maxFiles: -5 },
          validator
        )
    ).toThrow('File logging maxFiles must be positive')
  })

  afterAll(() => {
    rmSync(directory, { recursive: true, force: true })
  })
})
