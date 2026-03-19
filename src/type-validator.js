import { ColorinoBrowserColorized, ColorinoBrowserCss, ColorinoBrowserObject, } from './types.js';
export class TypeValidator {
    static isNull(value) {
        return value === null;
    }
    static isUndefined(value) {
        return value === undefined;
    }
    static isNullOrUndefined(value) {
        return value == null;
    }
    static isObject(value) {
        return typeof value === 'object' && value !== null;
    }
    static isString(value) {
        return typeof value === 'string' || value instanceof String;
    }
    static isArray(value) {
        return Array.isArray(value);
    }
    static isError(value) {
        return value instanceof Error;
    }
    static isBrowserColorizedArg(value) {
        return TypeValidator.isObject(value) && ColorinoBrowserColorized in value;
    }
    static isBrowserCssArg(value) {
        return (typeof value === 'object' &&
            value !== null &&
            ColorinoBrowserCss in value &&
            value[ColorinoBrowserCss] === true);
    }
    static isBrowserObjectArg(value) {
        return TypeValidator.isObject(value) && ColorinoBrowserObject in value;
    }
    static isAnsiColoredString(value) {
        // eslint-disable
        return (TypeValidator.isString(value) && /\x1b\[[0-9;]*m/.test(value.toString()));
    }
    static isFormattableObject(value) {
        return (TypeValidator.isObject(value) &&
            !TypeValidator.isError(value) &&
            !TypeValidator.isBrowserColorizedArg(value) &&
            !TypeValidator.isString(value));
    }
    static isStackLikeString(value) {
        if (!TypeValidator.isString(value))
            return false;
        const text = value.toString();
        if (!text.includes('\n'))
            return false;
        const lines = text.split('\n').map(line => line.trim());
        let stackFrameLines = 0;
        let hasErrorHeader = false;
        for (const line of lines) {
            if (!line)
                continue;
            if (!hasErrorHeader && line.includes('Error')) {
                hasErrorHeader = true;
                continue;
            }
            if (line.startsWith('at ')) {
                stackFrameLines++;
            }
            else if (line.match(/:\d+:\d+\)?$/)) {
                stackFrameLines++;
            }
            if (stackFrameLines >= 1) {
                return true;
            }
        }
        return false;
    }
    static isConsoleMethod(level) {
        return ['log', 'info', 'warn', 'error', 'trace', 'debug'].includes(level);
    }
}
//# sourceMappingURL=type-validator.js.map