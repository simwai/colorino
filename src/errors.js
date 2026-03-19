export class InputValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InputValidationError';
        Object.setPrototypeOf(this, InputValidationError.prototype);
    }
}
/** Error thrown when a configuration option is invalid. */
export class ColorinoConfigError extends Error {
    optionPath;
    reason;
    receivedValue;
    constructor(optionPath, reason, receivedValue) {
        super(`Invalid option '${optionPath}': ${reason}`);
        this.optionPath = optionPath;
        this.reason = reason;
        this.receivedValue = receivedValue;
        this.name = 'ColorinoConfigError';
        Object.setPrototypeOf(this, ColorinoConfigError.prototype);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            optionPath: this.optionPath,
            reason: this.reason,
            receivedValue: this.receivedValue,
            stack: this.stack,
        };
    }
}
//# sourceMappingURL=errors.js.map