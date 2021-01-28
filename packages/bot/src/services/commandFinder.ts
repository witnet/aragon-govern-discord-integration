import { injectable } from 'inversify'
import { Command } from '../types'

@injectable()
export class CommandFinder {

    public isNewDaoMessage(message: string) {
        return message.search(Command.New) >= 0
    }
}