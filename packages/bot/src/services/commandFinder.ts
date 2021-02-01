import { injectable } from 'inversify'
import { Command } from '../types'

@injectable()
export class CommandFinder {

    public isNewDaoMessage(message: string) {
        return message.search(Command.NewDao) >= 0
    }

    public isNewPropoosalMessage(message: string) {
        return message.search(Command.NewProposal) > 0
    }
}