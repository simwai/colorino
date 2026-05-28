export class InputValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InputValidationError'
    Object.setPrototypeOf(this, InputValidationError.prototype)
  }
}

/** Error thrown when a configuration option is invalid. */
export class ColorinoConfigError extends Error {
  constructor(
    public readonly optionPath: string,
    public readonly reason: string,
    public readonly receivedValue: unknown
  ) {
    super(`Invalid option '${optionPath}': ${reason}`)
    this.name = 'ColorinoConfigError'
    Object.setPrototypeOf(this, ColorinoConfigError.prototype)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      optionPath: this.optionPath,
      reason: this.reason,
      receivedValue: this.receivedValue,
      stack: this.stack,
    }
  }
}
