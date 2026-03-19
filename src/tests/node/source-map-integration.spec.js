import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
describe('Colorino - Source Map Integration', () => {
    it('reports original .ts source line when running with node --enable-source-maps', { timeout: 60000 }, async () => {
        const tempDir = path.resolve(process.cwd(), 'temp-source-map-final');
        if (!fs.existsSync(tempDir))
            fs.mkdirSync(tempDir);
        try {
            const tsFile = path.resolve(tempDir, 'app.ts');
            // Note: app.ts is at /app/temp-source-map-final/app.ts
            // createColorino is at /app/src/node.ts
            // Relative path from tempDir/app.ts to /app/src/node.js is ../src/node.js
            fs.writeFileSync(tsFile, `
import { createColorino } from '../src/node.js';
const logger = createColorino({}, {
  metadata: {
    callSite: {
      isEnabled: true,
      isCallerPathRelative: false
    }
  }
});
// Line 11
logger.log('integrated-test');
      `);
            // Minimal tsconfig to enable source maps
            fs.writeFileSync(path.resolve(tempDir, 'tsconfig.json'), JSON.stringify({
                compilerOptions: {
                    target: "ESNext",
                    module: "ESNext",
                    moduleResolution: "Node",
                    sourceMap: true,
                    esModuleInterop: true,
                    skipLibCheck: true,
                    rootDir: ".."
                },
                include: ["app.ts", "../src/**/*.ts"]
            }));
            // Compile using local tsc
            execSync('npx tsc -p ' + tempDir, { stdio: 'ignore' });
            const jsFile = path.resolve(tempDir, 'app.js');
            // Run with --enable-source-maps
            const output = execSync('node --enable-source-maps ' + jsFile, {
                env: { ...process.env, NO_COLOR: '1' }
            }).toString();
            expect(output).toContain('integrated-test');
            // Should show app.ts (the original source) instead of app.js
            expect(output).toContain('[app.ts:12:');
        }
        finally {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        }
    });
});
//# sourceMappingURL=source-map-integration.spec.js.map