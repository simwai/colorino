import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createColorino } from '../../node.js'
import * as fs from 'node:fs'
import * as path from 'node:path'

describe('Colorino - File Logging', () => {
  const logDir = path.join(process.cwd(), 'test-logs-dir')
  const logPath = path.join(logDir, 'test.log')

  beforeEach(() => {
    if (fs.existsSync(logDir)) {
      fs.rmSync(logDir, { recursive: true, force: true })
    }
  })

  afterEach(() => {
    if (fs.existsSync(logDir)) {
      fs.rmSync(logDir, { recursive: true, force: true })
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

    let retries = 0
    while (retries < 20 && !fs.existsSync(logPath)) {
      await new Promise(resolve => setTimeout(resolve, 50))
      retries++
    }

    expect(fs.existsSync(logPath)).toBe(true)
    const content = fs.readFileSync(logPath, 'utf-8')
    expect(content).toContain('[info] Test log message')
  })
})
