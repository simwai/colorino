import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TypeValidator } from '../../type-validator.js';
export function getFilteredEnv(overrides = {}) {
    const filtered = Object.fromEntries(Object.entries(process.env).filter((entry) => !TypeValidator.isNullOrUndefined(entry[1])));
    return { ...filtered, ...overrides };
}
export const testTimeouts = {
    default: 3000,
    cmd: 10000,
    powerShell: 10000,
    pty: 20000,
    wait: 5000,
    waitInterval: 50,
    stdinDelay: 50,
    backslashEcho: 500,
    ptyCleanup: 1000,
    initialPrompt: 8000,
    exitCommand: 5000,
};
export function getScriptPaths(currentFile, scripts) {
    const __dirname = dirname(fileURLToPath(currentFile));
    return Object.fromEntries(Object.entries(scripts).map(([key, path]) => [key, join(__dirname, path)]));
}
export function spawnProcess(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            env: getFilteredEnv(options.env),
            stdio: options.stdio ?? ['pipe', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        child.stdout?.on('data', chunk => {
            stdout += chunk.toString();
        });
        child.stderr?.on('data', chunk => {
            stderr += chunk.toString();
        });
        child.on('error', error => {
            reject(new Error(`Failed to spawn ${command}: ${error.message}`));
        });
        child.on('close', exitCode => {
            resolve({ stdout, stderr, exitCode });
        });
    });
}
//# sourceMappingURL=integration.js.map