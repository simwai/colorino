export class ColorinoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ColorinoError'
    Object.setPrototypeOf(this, ColorinoError.prototype)
  }
}

export class OscQueryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OscQueryError'
    Object.setPrototypeOf(this, OscQueryError.prototype)
  }
}
