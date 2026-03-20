import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createColorino } from '../../node.js'
import * as fs from 'node:fs'
import * as path from 'node:path'

describe('Colorino - File Logging', () => {
  const logDir = path.join(process.cwd(), 'test-logs-dir')
  const logPath = path.join(logDir, 'test.log')

  beforeEach(() => {
    if (fs.existsSync(logDir)) fs.rmSync(logDir, { recursive: true, force: true })
  })

  afterEach(() => {
    if (fs.existsSync(logDir)) fs.rmSync(logDir, { recursive: true, force: true })
  })

  it('should create directory and write to file', async () => {
    const logger = createColorino({}, { fileLogging: { isEnabled: true, path: logPath } })
    logger.info('Test log message')
    let content = ''
    for (let i = 0; i < 50; i++) {
      await new Promise(r => setTimeout(r, 100))
      if (fs.existsSync(logPath)) {
        content = fs.readFileSync(logPath, 'utf-8')
        if (content.includes('[info] Test log message')) break
      }
    }
    expect(content).toContain('[info] Test log message')
  })
})
