import { ColorinoBrowserColorized, LOG_LEVEL_PRIORITY, } from './types.js';
import { ColorLevel } from './enums.js';
import { TypeValidator } from './type-validator.js';
export class AbstractColorino {
    userPalette;
    validator;
    options;
    colorLevel;
    palette;
    constructor(initialPalette, userPalette, validator, colorLevel, options = {}) {
        this.userPalette = userPalette;
        this.validator = validator;
        this.options = options;
        this.palette = { ...initialPalette, ...userPalette };
        const paletteValidation = this.validator.validatePalette(this.palette);
        if (paletteValidation.isErr()) {
            throw paletteValidation.error;
        }
        const optionsValidation = this.validator.validateOptions(this.options);
        if (optionsValidation.isErr()) {
            throw optionsValidation.error;
        }
        this.colorLevel = colorLevel;
    }
    log(...args) { this.logInternal('log', args); }
    info(...args) { this.logInternal('info', args); }
    warn(...args) { this.logInternal('warn', args); }
    error(...args) { this.logInternal('error', args); }
    trace(...args) { this.logInternal('trace', args); }
    debug(...args) { this.logInternal('debug', args); }
    fatal(...args) { this.logInternal('fatal', args); }
    colorize(text, hex) {
        if (this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv') {
            return text;
        }
        if (this.isBrowser()) {
            return {
                [ColorinoBrowserColorized]: true,
                text,
                hex
            };
        }
        const ansiPrefix = this.toAnsiPrefix(hex);
        return ansiPrefix ? `${ansiPrefix}${text}\x1b[0m` : text;
    }
    logInternal(level, args) {
        if (!this.isLevelEnabled(level))
            return;
        const callerInfo = this.captureCaller();
        const metadataTags = this.buildMetadataTags(level, callerInfo);
        const method = this.mapLevelToConsoleMethod(level);
        const formattedArgs = this.formatArgs(method, args, metadataTags);
        const consoleTarget = method === 'trace' ? 'log' : method;
        console[consoleTarget](...formattedArgs);
        if (!this.isBrowser() && this.options.fileLogging?.isEnabled) {
            this.writeToFile(level, args, callerInfo);
        }
    }
    mapLevelToConsoleMethod(level) {
        if (level === 'fatal')
            return 'error';
        if (['log', 'info', 'warn', 'error', 'trace', 'debug'].includes(level)) {
            return level;
        }
        return 'log';
    }
    isLevelEnabled(level) {
        const logLevelConfig = this.options.logLevel;
        if (!logLevelConfig)
            return true;
        const allowedLevels = logLevelConfig.allow ?? Object.keys(LOG_LEVEL_PRIORITY);
        if (!allowedLevels.includes(level))
            return false;
        const minimumLevel = logLevelConfig.min ?? 'trace';
        if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[minimumLevel])
            return false;
        if (logLevelConfig.deny?.includes(level))
            return false;
        return true;
    }
    captureCaller() {
        const callSiteConfig = this.options.metadata?.callSite;
        if (!(callSiteConfig?.isEnabled ?? false))
            return undefined;
        const error = new Error();
        const stack = error.stack;
        if (!stack)
            return undefined;
        const stackLines = stack.split('\n');
        let frameLine;
        for (let index = 1; index < stackLines.length; index++) {
            const line = stackLines[index];
            if (!line)
                continue;
            const lowerLine = line.toLowerCase();
            const isInternal = lowerLine.includes('colorino') || lowerLine.includes('loginternal') || lowerLine.includes('capturecaller');
            if (!isInternal) {
                frameLine = line;
                break;
            }
        }
        return frameLine ? this.parseStackLine(frameLine) : undefined;
    }
    parseStackLine(line) {
        const parts = line.trim().split(/\s+/);
        let locationString = parts[parts.length - 1];
        if (locationString.startsWith('(') && locationString.endsWith(')')) {
            locationString = locationString.slice(1, -1);
        }
        const lastColonIndex = locationString.lastIndexOf(':');
        if (lastColonIndex === -1)
            return undefined;
        const columnNumber = parseInt(locationString.slice(lastColonIndex + 1), 10);
        const secondLastColonIndex = locationString.lastIndexOf(':', lastColonIndex - 1);
        if (secondLastColonIndex === -1)
            return undefined;
        const lineNumber = parseInt(locationString.slice(secondLastColonIndex + 1, lastColonIndex), 10);
        const rawPath = locationString.slice(0, secondLastColonIndex);
        if (!rawPath)
            return undefined;
        let functionName;
        if (parts[1] !== locationString && parts[1] !== 'at') {
            functionName = parts[1];
        }
        const info = {
            filename: this.extractFilename(rawPath),
            relativePath: this.extractRelativePath(rawPath),
            line: lineNumber,
            column: columnNumber,
            functionName
        };
        if (this.options.metadata?.callSite?.resolve) {
            const resolved = this.options.metadata.callSite.resolve({
                file: info.filename,
                line: info.line,
                column: info.column,
                functionName: info.functionName
            });
            return {
                ...info,
                filename: resolved.file,
                line: resolved.line,
                column: resolved.column,
                functionName: resolved.functionName
            };
        }
        return info;
    }
    extractFilename(filePath) {
        const pathSegments = filePath.replace(/^(?:https?|file):\/\//, '').split(/[/\\]/);
        const lastSegment = pathSegments[pathSegments.length - 1] || '';
        return lastSegment.split(/[?#]/)[0] || '';
    }
    extractRelativePath(filePath) {
        if (this.isBrowser())
            return this.extractFilename(filePath);
        try {
            if (typeof process !== 'undefined' && process.cwd) {
                const currentWorkingDirectory = process.cwd();
                const normalizedPath = filePath.replace(/^(?:file):\/\//, '');
                if (normalizedPath.startsWith(currentWorkingDirectory)) {
                    return normalizedPath.slice(currentWorkingDirectory.length).replace(/^[/\\]/, '').replace(/\\/g, '/');
                }
            }
        }
        catch { }
        return this.extractFilename(filePath);
    }
    buildMetadataTags(_level, callerInfo) {
        const callSiteConfig = this.options.metadata?.callSite;
        if ((callSiteConfig?.isEnabled ?? false) && callerInfo) {
            const tag = this.formatCallSiteTag(callerInfo, callSiteConfig || {});
            return tag ? [tag] : [];
        }
        return [];
    }
    formatCallSiteTag(caller, config) {
        const isFileVisible = config.isCallerFileVisible ?? true;
        const isFunctionVisible = config.isCallerFunctionVisible ?? false;
        const isLineVisible = config.isCallerLineVisible ?? true;
        const isColumnVisible = config.isCallerColumnVisible ?? true;
        const isPathRelative = config.isCallerPathRelative ?? false;
        const filePart = isFileVisible ? (isPathRelative ? caller.relativePath : caller.filename) : '';
        const linePart = isLineVisible ? (isColumnVisible ? `${caller.line}:${caller.column}` : `${caller.line}`) : '';
        const location = filePart && linePart ? `${filePart}:${linePart}` : (filePart || linePart);
        let tagText = '';
        if (isFunctionVisible && caller.functionName) {
            tagText = location ? `[${caller.functionName}@${location}]` : `[${caller.functionName}]`;
        }
        else if (location) {
            tagText = `[${location}]`;
        }
        return tagText ? { text: tagText, position: config.position ?? 'postfix' } : null;
    }
    partitionTags(tags) {
        const prefixTags = [], postfixTags = [];
        for (const tag of tags) {
            if (tag.position === 'prefix')
                prefixTags.push(tag);
            else
                postfixTags.push(tag);
        }
        return { prefix: prefixTags, postfix: postfixTags };
    }
    toAnsiPrefix(_hex) { return ''; }
    formatValue(value, maxDepth = this.options.maxDepth ?? 5) {
        const visited = new WeakSet();
        const transform = (currentValue, depth) => {
            if (TypeValidator.isNullOrUndefined(currentValue) || !TypeValidator.isObject(currentValue)) {
                if (typeof currentValue === 'bigint')
                    return `${currentValue.toString()}n`;
                return currentValue;
            }
            if (visited.has(currentValue))
                return '[Circular]';
            visited.add(currentValue);
            if (depth >= maxDepth)
                return '[Object]';
            if (TypeValidator.isArray(currentValue)) {
                return currentValue.map(item => transform(item, depth + 1));
            }
            const result = {};
            for (const key in currentValue) {
                if (Object.prototype.hasOwnProperty.call(currentValue, key)) {
                    result[key] = transform(currentValue[key], depth + 1);
                }
            }
            visited.delete(currentValue);
            return result;
        };
        return JSON.stringify(transform(value, 0), null, 2);
    }
    filterStack(input) {
        const areNodeFramesVisible = this.options.areNodeFramesVisible ?? true;
        const areColorinoFramesVisible = this.options.areColorinoFramesVisible ?? false;
        const stackString = TypeValidator.isError(input) ? input.stack : (TypeValidator.isStackLikeString(input) ? input : '');
        if (!stackString)
            return '';
        const lines = stackString.split('\n');
        const header = lines[0] || '';
        const isErrorHeader = !header.trim().startsWith('at ');
        const frames = lines.slice(isErrorHeader ? 1 : 0).filter(line => {
            const lowerLine = line.toLowerCase();
            const isInternal = !areColorinoFramesVisible && lowerLine.includes('colorino');
            const isNodeInternal = !areNodeFramesVisible && lowerLine.includes('node:');
            return !(isInternal || isNodeInternal);
        });
        return isErrorHeader ? [header, ...frames].join('\n') : frames.join('\n');
    }
    cleanErrorStack(error) {
        if (error.stack)
            error.stack = this.filterStack(error.stack);
        return error;
    }
    buildCallerStack() {
        const errorTrace = new Error('Trace');
        const stack = errorTrace.stack;
        if (!stack)
            return undefined;
        const stackLines = stack.split('\n');
        let startIndex = 1;
        for (let index = 1; index < stackLines.length; index++) {
            if (!stackLines[index].toLowerCase().includes('colorino')) {
                startIndex = index;
                break;
            }
        }
        return this.filterStack(stackLines.slice(startIndex).join('\n')) || undefined;
    }
}
//# sourceMappingURL=abstract-colorino.js.map