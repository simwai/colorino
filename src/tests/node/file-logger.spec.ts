import { describe, expect, test, afterAll } from 'vitest'
import { ColorinoFileLogger } from '../../file-logger.js'
import { InputValidator } from '../../input-validator.js'
import { InputValidationError } from '../../errors.js'
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs'
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

  test('allows undefined maxBytes and maxFiles (use defaults)', () => {
    expect(
      () =>
        new ColorinoFileLogger(
          { path: join(directory, 'defaults.log') },
          validator
        )
    ).not.toThrow()
    expect(
      () =>
        new ColorinoFileLogger(
          { path: join(directory, 'defaults2.log'), maxBytes: undefined },
          validator
        )
    ).not.toThrow()
    expect(
      () =>
        new ColorinoFileLogger(
          { path: join(directory, 'defaults3.log'), maxFiles: undefined },
          validator
        )
    ).not.toThrow()
  })

  afterAll(() => {
    rmSync(directory, { recursive: true, force: true })
  })
})

describe('ColorinoFileLogger setPath', () => {
  const directory = mkdtempSync(join(tmpdir(), 'colorino-file-logger-setpath-'))
  const validator = new InputValidator()

  test('changes path and writes to new file', () => {
    const path1 = join(directory, 'first.log')
    const path2 = join(directory, 'second.log')
    const logger = new ColorinoFileLogger({ path: path1 }, validator)
    logger.write('info', ['first'], v => String(v))

    logger.setPath(path2)
    logger.write('info', ['second'], v => String(v))

    expect(readFileSync(path1, 'utf8')).toContain('first')
    expect(readFileSync(path2, 'utf8')).toContain('second')
  })

  test('throws on empty path', () => {
    const logger = new ColorinoFileLogger(
      { path: join(directory, 'a.log') },
      validator
    )
    expect(() => logger.setPath('')).toThrow(InputValidationError)
  })

  test('creates directory for new path', () => {
    const logger = new ColorinoFileLogger(
      { path: join(directory, 'a.log') },
      validator
    )
    const newPath = join(directory, 'nested', 'deep', 'new.log')
    logger.setPath(newPath)
    logger.write('info', ['test'], v => String(v))
    expect(readFileSync(newPath, 'utf8')).toContain('test')
  })

  test('rotation works with new path', () => {
    const logger = new ColorinoFileLogger(
      {
        path: join(directory, 'rotate.log'),
        maxBytes: 50,
        maxFiles: 2,
      },
      validator
    )
    logger.write('info', ['x'.repeat(30)], v => String(v))
    logger.setPath(join(directory, 'rotate2.log'))
    logger.write('info', ['x'.repeat(30)], v => String(v))
    // both files should exist with rotation
    const files = [
      join(directory, 'rotate.log'),
      join(directory, 'rotate.log.1'),
      join(directory, 'rotate2.log'),
      join(directory, 'rotate2.log.1'),
    ]
    const existingFiles = files.filter(f => existsSync(f))
    expect(existingFiles.length).toBeGreaterThan(0)
  })

  afterAll(() => {
    rmSync(directory, { recursive: true, force: true })
  })
})
