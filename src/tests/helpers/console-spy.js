import util from 'node:util';
import { vi, test as base } from 'vitest';
import { createColorino } from '../../node.js';
import { createTestPalette } from './palette.js';
export function spyConsoleMethod(methodName, options) {
    const originalMethod = console[methodName].bind(console);
    const capturedCalls = [];
    const spy = vi
        .spyOn(console, methodName)
        .mockImplementation((...parameters) => {
        capturedCalls.push(parameters);
        options.onCall?.(parameters);
        if (options.callThrough) {
            originalMethod(...parameters);
        }
    });
    return {
        spy,
        getCalls: () => capturedCalls,
        restore: () => spy.mockRestore(),
    };
}
export function stringifyConsoleParameter(parameter) {
    if (typeof parameter === 'string') {
        return parameter;
    }
    return util.inspect(parameter);
}
export function stringifyConsoleLine(parameters, prefix) {
    const parts = [];
    if (prefix !== undefined) {
        parts.push(prefix);
    }
    for (const parameter of parameters) {
        parts.push(stringifyConsoleParameter(parameter));
    }
    return `${parts.join(' ')}\n`;
}
const methodsToStdoutSpy = ['log', 'info', 'debug', 'trace'];
const methodsToStderrSpy = ['warn', 'error'];
export const test = base.extend({
    // eslint-disable-next-line
    stdoutSpy: async ({}, use) => {
        const chunks = [];
        const callThrough = true;
        const spyInstances = methodsToStdoutSpy.map(method => {
            return spyConsoleMethod(method, {
                callThrough,
                onCall: (parameters) => {
                    chunks.push(stringifyConsoleLine(parameters));
                },
            });
        });
        await use({
            getOutput: () => chunks.join(''),
        });
        for (const spyInstance of spyInstances) {
            spyInstance.restore();
        }
    },
    // eslint-disable-next-line
    stderrSpy: async ({}, use) => {
        const chunks = [];
        const callThrough = true;
        const spyInstances = methodsToStderrSpy.map(method => {
            return spyConsoleMethod(method, {
                callThrough,
                onCall: (parameters) => {
                    chunks.push(stringifyConsoleLine(parameters));
                },
            });
        });
        await use({
            getOutput: () => chunks.join(''),
        });
        for (const spyInstance of spyInstances) {
            spyInstance.restore();
        }
    },
    // eslint-disable-next-line
    logger: async ({}, use) => {
        await use(createColorino(createTestPalette(), {}));
    },
    env: [{}, { injected: true }],
});
//# sourceMappingURL=console-spy.js.map