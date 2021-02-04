import { injectable } from 'inversify'
import { Command } from '../types'

@injectable()
export class CommandFinder {
  public isNewDaoMessage (message: string) {
    return message.search(Command.NewDao) == 0
  }

  public isNewProposalMessage (message: string) {
    return message.search(Command.NewProposal) == 0
  }

  public isSetupMessage (message: string) {
    return message.search(Command.Setup) == 0
  }
}
