import { test as base, describe, expect } from 'vitest';
import { getScriptPaths, spawnProcess, testTimeouts, } from '../helpers/integration.js';
const scriptPaths = getScriptPaths(import.meta.url, {
    testCmdColors: '../helpers/test-cmd-colors.ts',
    testOscQuery: '../helpers/test-osc-query.ts',
});
const test = base.extend({
    // eslint-disable-next-line
    runInPowerShell: async ({}, use) => {
        await use((scriptPath, env) => {
            return spawnProcess('powershell.exe', ['-NoProfile', '-Command', 'npx', 'tsx', scriptPath], {
                env,
                stdio: ['inherit', 'pipe', 'pipe'],
            });
        });
    },
});
describe('NodeColorSupportDetector - PowerShell - Integration Test', () => {
    test.skipIf(process.platform !== 'win32')('should detect color support in PowerShell', async ({ runInPowerShell }) => {
        const result = await runInPowerShell(scriptPaths.testCmdColors);
        expect(result.exitCode).toBe(0);
        const match = result.stdout.match(/ColorLevel:\s*(\d+)/);
        expect(match).toBeTruthy();
        expect(parseInt(match[1], 10)).toBeGreaterThanOrEqual(0);
        expect(result.stdout).toContain('Theme:');
    }, testTimeouts.powerShell);
    test.skipIf(process.platform !== 'win32' || !process.env['WT_SESSION'])('should detect OSC 11 theme in Windows Terminal', async ({ runInPowerShell }) => {
        const result = await runInPowerShell(scriptPaths.testOscQuery);
        expect(result.exitCode).toBe(0);
        expect(['dark', 'light']).toContain(result.stdout.trim());
    }, testTimeouts.powerShell);
});
//# sourceMappingURL=node-color-support-powershell.integration.spec.js.map