import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createColorino } from '../../node.js'
import * as fs from 'node:fs'
import * as path from 'node:path'

describe('Colorino - File Logging', () => {
  const logPath = 'test-logs/test.log'

  beforeEach(() => {
    if (fs.existsSync('test-logs')) {
      fs.rmSync('test-logs', { recursive: true, force: true })
    }
  })

  afterEach(() => {
    if (fs.existsSync('test-logs')) {
      fs.rmSync('test-logs', { recursive: true, force: true })
    }
  })

  it('should create directory and write to file', async () => {
    const logger = createColorino({}, {
      fileLogging: {
        isEnabled: true,
        path: logPath
      }
    })

    logger.info('Test log message')

    // Wait a bit for async write
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(fs.existsSync(logPath)).toBe(true)
    const content = fs.readFileSync(logPath, 'utf-8')
    expect(content).toContain('[info] Test log message')
  })
})
