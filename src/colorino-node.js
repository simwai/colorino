import * as fs from 'node:fs';
import * as path from 'node:path';
import { AbstractColorino } from './abstract-colorino.js';
import { ColorLevel } from './enums.js';
import { LOG_LEVEL_PRIORITY, } from './types.js';
import { TypeValidator } from './type-validator.js';
import { colorConverter } from './color-converter.js';
export class ColorinoNode extends AbstractColorino {
    logQueue = [];
    isWriting = false;
    constructor(initialPalette, userPalette, validator, colorLevel, options = {}) {
        super(initialPalette, userPalette, validator, colorLevel, options);
    }
    gradient(text, startHex, endHex) {
        const isNoColor = this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv';
        if (isNoColor || this.colorLevel === ColorLevel.ANSI) {
            return text;
        }
        const characters = Array.from(text);
        const gradientColors = colorConverter.hex.gradient(startHex, endHex, characters.length);
        const coloredText = characters.map((char, index) => {
            const rgbColor = gradientColors[index] || [0, 0, 0];
            const [red, green, blue] = rgbColor;
            if (this.colorLevel === ColorLevel.TRUECOLOR) {
                return `\x1b[38;2;${red};${green};${blue}m${char}`;
            }
            const ansi256Color = colorConverter.rgb.toAnsi256(rgbColor);
            return `\x1b[38;5;${ansi256Color}m${char}`;
        }).join('');
        return `${coloredText}\x1b[0m`;
    }
    writeToFile(level, args, caller) {
        const config = this.options.fileLogging;
        if (!config?.isEnabled) {
            return;
        }
        const minimumLevel = config.minLevel ?? this.options.logLevel?.min ?? 'trace';
        if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[minimumLevel]) {
            return;
        }
        const message = args.map(arg => {
            if (TypeValidator.isError(arg)) {
                return `${arg.name}: ${arg.message}\n${arg.stack}`;
            }
            if (TypeValidator.isObject(arg)) {
                return this.formatValue(arg);
            }
            return String(arg);
        }).join(' ');
        const timestamp = new Date().toISOString();
        let logLine = `${timestamp} [${level}] ${message}`;
        const metadataConfig = this.options.metadata?.callSite;
        const isMetadataEnabled = metadataConfig?.isEnabled ?? false;
        if (isMetadataEnabled && caller) {
            const file = metadataConfig?.isCallerPathRelative ? caller.relativePath : caller.filename;
            const location = `${file}:${caller.line}:${caller.column}`;
            logLine += ` [${location}]`;
        }
        this.logQueue.push(`${logLine}\n`);
        this.processQueue();
    }
    async processQueue() {
        if (this.isWriting || this.logQueue.length === 0) {
            return;
        }
        this.isWriting = true;
        const fileLoggingConfig = this.options.fileLogging;
        const logFilePath = path.resolve(process.cwd(), fileLoggingConfig.path);
        try {
            const directoryPath = path.dirname(logFilePath);
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath, { recursive: true });
            }
            while (this.logQueue.length > 0) {
                const line = this.logQueue.shift();
                const writeFlag = fileLoggingConfig.isAppendMode === false ? 'w' : 'a';
                await fs.promises.appendFile(logFilePath, line, { flag: writeFlag });
                if (fileLoggingConfig.isAppendMode === false) {
                    fileLoggingConfig.isAppendMode = true;
                }
            }
        }
        catch (error) {
            console.error('Colorino: Failed to write to log file:', error);
        }
        finally {
            this.isWriting = false;
        }
    }
    formatArgs(method, args, tags = []) {
        const hasErrorArg = args.some(arg => TypeValidator.isError(arg) || TypeValidator.isStackLikeString(arg));
        const argsToProcess = (method === 'trace' && !hasErrorArg)
            ? [...args, this.buildCallerStack()]
            : args;
        const colorHexValue = this.palette[method] || '#ffffff';
        const ansiPrefixCode = this.toAnsiPrefix(colorHexValue);
        const { prefix, postfix } = this.partitionTags(tags);
        const finalFormattedArgs = [];
        // Prepend prefix tags
        for (const tag of prefix) {
            const coloredTag = ansiPrefixCode ? `${ansiPrefixCode}${tag.text}\x1b[0m` : tag.text;
            finalFormattedArgs.push(coloredTag);
        }
        let previousWasObject = false;
        for (const arg of argsToProcess) {
            if (TypeValidator.isFormattableObject(arg)) {
                const formattedValue = this.formatValue(arg);
                finalFormattedArgs.push(`\n${formattedValue}`);
                previousWasObject = true;
            }
            else if (TypeValidator.isError(arg)) {
                const cleanedError = this.cleanErrorStack(arg);
                if (!cleanedError.name.trim() || !cleanedError.message.trim() || !cleanedError.stack?.trim()) {
                    continue;
                }
                const errorHeader = `${cleanedError.name}: ${cleanedError.message}`;
                const errorStackLines = cleanedError.stack.split('\n').slice(1).join('\n');
                const formattedError = errorStackLines
                    ? `${ansiPrefixCode ? `${ansiPrefixCode}${errorHeader}\x1b[0m` : errorHeader}\n${errorStackLines}`
                    : (ansiPrefixCode ? `${ansiPrefixCode}${errorHeader}\x1b[0m` : errorHeader);
                finalFormattedArgs.push(previousWasObject ? formattedError : `\n${formattedError}`);
                previousWasObject = true;
            }
            else if (TypeValidator.isStackLikeString(arg)) {
                const filteredStackString = this.filterStack(arg);
                if (!filteredStackString.trim()) {
                    continue;
                }
                const stackLines = filteredStackString.split('\n');
                const hasErrorHeaderLine = stackLines[0]?.includes('Error') && stackLines[0]?.includes(':');
                if (hasErrorHeaderLine) {
                    const header = ansiPrefixCode ? `${ansiPrefixCode}${stackLines[0]}\x1b[0m` : stackLines[0];
                    const body = stackLines.slice(1).join('\n');
                    finalFormattedArgs.push(`\n${body ? `${header}\n${body}` : header}`);
                }
                else {
                    finalFormattedArgs.push(`\n${filteredStackString}`);
                }
                previousWasObject = true;
            }
            else if (TypeValidator.isString(arg)) {
                const stringContent = previousWasObject ? `\n${arg}` : arg;
                const shouldApplyColor = ansiPrefixCode && !TypeValidator.isAnsiColoredString(arg) && !TypeValidator.isStackLikeString(arg);
                finalFormattedArgs.push(shouldApplyColor ? `${ansiPrefixCode}${stringContent}\x1b[0m` : stringContent);
                previousWasObject = false;
            }
            else {
                finalFormattedArgs.push(arg);
                previousWasObject = false;
            }
        }
        // Append postfix tags
        for (const tag of postfix) {
            const coloredTag = ansiPrefixCode ? `${ansiPrefixCode}${tag.text}\x1b[0m` : tag.text;
            finalFormattedArgs.push(coloredTag);
        }
        return finalFormattedArgs;
    }
    isBrowser() {
        return false;
    }
    toAnsiPrefix(hex) {
        const isNoColorEnv = this.colorLevel === ColorLevel.NO_COLOR || this.colorLevel === 'UnknownEnv';
        if (isNoColorEnv) {
            return '';
        }
        if (this.colorLevel === ColorLevel.TRUECOLOR) {
            const [red, green, blue] = colorConverter.hex.toRgb(hex);
            return `\x1b[38;2;${red};${green};${blue}m`;
        }
        if (this.colorLevel === ColorLevel.ANSI256) {
            const ansi256ColorCode = colorConverter.hex.toAnsi256(hex);
            return `\x1b[38;5;${ansi256ColorCode}m`;
        }
        const ansi16ColorCode = colorConverter.hex.toAnsi16(hex);
        return `\x1b[${ansi16ColorCode}m`;
    }
}
//# sourceMappingURL=colorino-node.js.map