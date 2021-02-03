type ErrorOptions = {
  code?: string
  name?: string
}

export class ErrorException extends Error {
  constructor (
    message = 'An unexpected error happened.',
    { code = 'ErrorException', name = 'ErrorException' }: ErrorOptions = {}
  ) {
    super(message)

    // We define these as non-enumarable to prevent them
    // from appearing with the error in the console.
    this.defineNonEnumerable('name', name)
    this.defineNonEnumerable('code', code)
  }

  private defineNonEnumerable (name: string, value: any) {
    Object.defineProperty(this, name, { value, enumerable: false })
  }
}

export class ErrorUnexpectedResult extends ErrorException {
  constructor (
    message = 'The resource doesn’t correspond to the expected result.',
    {
      code = 'ErrorUnexpectedResult',
      name = 'ErrorUnexpectedResult'
    }: ErrorOptions = {}
  ) {
    super(message, { code, name })
  }
}
