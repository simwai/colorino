import { describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { createColorino } from '../../node.js'

describe('Colorino - Source Map Support', () => {
  describe('Unit Tests', () => {
    it('parses stack lines translated to .ts by source maps', () => {
      const logger = createColorino() as any
      const translatedLine =
        '    at Object.<anonymous> (/app/src/services/userService.ts:42:10)'
      const info = logger.parseStackLine(translatedLine)
      expect(info).toBeDefined()
      expect(info.filename).toBe('userService.ts')
      expect(info.line).toBe(42)
      expect(info.column).toBe(10)
    })
  })

  describe('Integration Test (via tsx)', () => {
    it('reports correct original source file (.ts) when running with source-map support', () => {
      const tempFile = path.resolve(process.cwd(), 'temp-source-map-verify.ts')
      fs.writeFileSync(
        tempFile,
        `
import { createColorino } from './src/node.js';
const logger = createColorino({}, { metadata: { callSite: { isEnabled: true, isCallerPathRelative: false } } });
logger.log('integrated-source-map-test');
      `
      )

      try {
        const output = execSync('npx tsx ' + tempFile, {
          env: { ...process.env, NO_COLOR: '1' },
        }).toString()
        expect(output).toContain('integrated-source-map-test')
        expect(output).toContain('[temp-source-map-verify.ts:4:')
      } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
      }
    })
  })
})
