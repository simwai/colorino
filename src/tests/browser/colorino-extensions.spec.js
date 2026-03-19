import { describe, expect, vi, test as baseTest } from 'vitest';
import { createColorino } from '../../browser.js';
const test = baseTest.extend({
    mocks: async ({}, use) => {
        const spies = {
            log: vi.spyOn(console, 'log').mockImplementation(() => { }),
            info: vi.spyOn(console, 'info').mockImplementation(() => { }),
        };
        await use(spies);
        vi.restoreAllMocks();
    },
});
describe('Colorino - Browser Extensions', () => {
    test('injects metadata tags in browser formatted output', ({ mocks }) => {
        const logger = createColorino({}, {
            metadata: { callSite: { isEnabled: true } }
        });
        logger.log('browser meta');
        const call = mocks.log.mock.calls[0];
        // In Browser implementation: parts.push('%c %s') and fArgs.push(`color:${colorHex}`, tag.text)
        // tag.text is "[file:line:col]"
        expect(call[0]).toContain('%c %s');
        const tagText = call[call.length - 1];
        expect(tagText).toMatch(/\[.+:\d+:\d+\]/);
    });
});
//# sourceMappingURL=colorino-extensions.spec.js.map