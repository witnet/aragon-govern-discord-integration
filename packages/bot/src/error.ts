export class ExecuteError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'ExecuteError'
  }
}

export class ScheduleError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'ScheduleError'
  }
}
