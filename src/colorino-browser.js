import { AbstractColorino } from './abstract-colorino.js';
import { ColorLevel } from './enums.js';
import { ColorinoBrowserCss, } from './types.js';
import { TypeValidator } from './type-validator.js';
export class ColorinoBrowser extends AbstractColorino {
    constructor(initialPalette, userPalette, validator, colorLevel, options = {}) {
        super(initialPalette, userPalette, validator, colorLevel, options);
    }
    gradient(text, startHex, endHex) {
        const isNoColor = this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv';
        if (isNoColor) {
            return text;
        }
        const gradientCss = `background: linear-gradient(to right, ${startHex}, ${endHex}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`;
        return { [ColorinoBrowserCss]: true, text, css: gradientCss };
    }
    css(text, style) {
        const isNoColor = this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv';
        if (isNoColor) {
            return text;
        }
        return {
            [ColorinoBrowserCss]: true,
            text,
            css: this.normalizeCssStyle(style)
        };
    }
    writeToFile() {
        // File logging is not supported in the browser environment
    }
    formatArgs(method, args, tags = []) {
        const hasError = args.some(arg => TypeValidator.isError(arg) || TypeValidator.isStackLikeString(arg));
        const argsToProcess = (method === 'trace' && !hasError)
            ? (() => {
                const stack = this.buildCallerStack();
                return stack ? [...args, stack] : args;
            })()
            : args;
        const colorHex = this.palette[method] || '#ffffff';
        const formatStringParts = [];
        const finalArguments = [];
        const { prefix, postfix } = this.partitionTags(tags);
        // Prepend prefix tags
        for (const tag of prefix) {
            formatStringParts.push('%c%s');
            finalArguments.push(`color:${colorHex}`, tag.text);
        }
        let lastWasObject = false;
        for (const arg of argsToProcess) {
            if (TypeValidator.isBrowserColorizedArg(arg)) {
                formatStringParts.push(`%c${arg.text}`);
                finalArguments.push(`color:${arg.hex}`);
                lastWasObject = false;
            }
            else if (TypeValidator.isBrowserCssArg(arg)) {
                formatStringParts.push(`%c${arg.text}`);
                finalArguments.push(arg.css);
                lastWasObject = false;
            }
            else if (TypeValidator.isFormattableObject(arg)) {
                formatStringParts.push(lastWasObject ? '%o' : '\n%o');
                finalArguments.push(arg);
                lastWasObject = true;
            }
            else if (TypeValidator.isError(arg)) {
                const cleanedError = this.cleanErrorStack(arg);
                if (!cleanedError.name.trim() || !cleanedError.message.trim() || !cleanedError.stack?.trim()) {
                    continue;
                }
                const errorHeader = `${cleanedError.name}: ${cleanedError.message}`;
                const errorStack = cleanedError.stack.split('\n').slice(1).join('\n');
                formatStringParts.push(lastWasObject ? '%c%s' : '\n%c%s');
                finalArguments.push(`color:${colorHex}`, errorHeader);
                if (errorStack) {
                    formatStringParts.push('\n%s');
                    finalArguments.push(errorStack);
                }
                lastWasObject = true;
            }
            else if (TypeValidator.isStackLikeString(arg)) {
                const filteredStack = this.filterStack(arg);
                if (!filteredStack.trim()) {
                    continue;
                }
                formatStringParts.push('\n%s');
                finalArguments.push(filteredStack);
                lastWasObject = true;
            }
            else if (TypeValidator.isString(arg)) {
                const stringValue = lastWasObject ? `\n${arg}` : arg;
                formatStringParts.push(`%c${stringValue}`);
                finalArguments.push(`color:${colorHex}`);
                lastWasObject = false;
            }
            else {
                formatStringParts.push('%o');
                finalArguments.push(arg);
                lastWasObject = false;
            }
        }
        // Append postfix tags
        for (const tag of postfix) {
            formatStringParts.push('%c %s');
            finalArguments.push(`color:${colorHex}`, tag.text);
        }
        if (formatStringParts.length === 0) {
            return argsToProcess;
        }
        return [formatStringParts.join(' '), ...finalArguments];
    }
    isBrowser() {
        return true;
    }
    normalizeCssStyle(style) {
        if (TypeValidator.isString(style)) {
            return style;
        }
        const styleParts = [];
        for (const property in style) {
            if (Object.prototype.hasOwnProperty.call(style, property) && style[property]) {
                styleParts.push(`${property}:${style[property]}`);
            }
        }
        return styleParts.join(';');
    }
}
//# sourceMappingURL=colorino-browser.js.map