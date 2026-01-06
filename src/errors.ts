export class InputValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InputValidationError'
    Object.setPrototypeOf(this, InputValidationError.prototype)
  }
}
