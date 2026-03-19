import { describe, expect, it } from 'vitest';
import { createColorino } from '../../node.js';
describe('Colorino - Source Map Compatibility (Unit)', () => {
    it('parses stack lines that have been translated by source maps (.ts files)', () => {
        // We can't easily trigger real source maps in a unit test environment without complex setup,
        // but we can verify the parser handles the resulting strings correctly.
        const logger = createColorino();
        // Simulating a stack line after Node.js source map translation
        const translatedLine = '    at Object.<anonymous> (/app/src/services/userService.ts:42:10)';
        const info = logger.parseStackLine(translatedLine);
        expect(info).toBeDefined();
        expect(info.filename).toBe('userService.ts');
        expect(info.line).toBe(42);
        expect(info.column).toBe(10);
    });
    it('parses stack lines with anonymous functions and .ts extension', () => {
        const logger = createColorino();
        const line = '    at /app/src/index.ts:5:1';
        const info = logger.parseStackLine(line);
        expect(info).toBeDefined();
        expect(info.filename).toBe('index.ts');
        expect(info.line).toBe(5);
        expect(info.column).toBe(1);
    });
});
//# sourceMappingURL=source-map-unit.spec.js.map