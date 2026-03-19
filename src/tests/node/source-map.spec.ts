import { describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { createColorino } from '../../node.js'

describe('Colorino - Source Map Support', () => {
  describe('Unit Tests', () => {
    it('parses stack lines translated to .ts by source maps', () => {
      const logger = createColorino() as any

      // Simulating a stack line after translation (e.g., via --enable-source-maps or ts-node)
      const translatedLine = '    at Object.<anonymous> (/app/src/services/userService.ts:42:10)'
      const info = logger.parseStackLine(translatedLine)

      expect(info).toBeDefined()
      expect(info.filename).toBe('userService.ts')
      expect(info.line).toBe(42)
      expect(info.column).toBe(10)
    })

    it('parses stack lines with anonymous functions pointing to .ts files', () => {
      const logger = createColorino() as any
      const line = '    at /app/src/index.ts:5:1'
      const info = logger.parseStackLine(line)

      expect(info).toBeDefined()
      expect(info.filename).toBe('index.ts')
      expect(info.line).toBe(5)
      expect(info.column).toBe(1)
    })
  })

  describe('Integration Test (via tsx)', () => {
    it('reports correct original source file (.ts) when running with source-map support', () => {
      const tempFile = path.resolve(process.cwd(), 'temp-source-map-verify.ts')

      fs.writeFileSync(tempFile, `
import { createColorino } from './src/node.js';
const logger = createColorino({}, {
  metadata: {
    callSite: {
      isEnabled: true,
      isCallerPathRelative: false
    }
  }
});
// The next line is line 12
logger.log('integrated-source-map-test');
      `)

      try {
        // tsx enables source maps by default and provides a good environment for this test
        const output = execSync('npx tsx ' + tempFile, {
          env: { ...process.env, NO_COLOR: '1' }
        }).toString()

        expect(output).toContain('integrated-source-map-test')
        // Verify it points to the .ts file and the correct line
        expect(output).toContain('[temp-source-map-verify.ts:12:')
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile)
        }
      }
    })
  })
})
