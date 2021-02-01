import { Message } from 'discord.js'
import { inject, injectable } from 'inversify'

import { CommandFinder } from './commandFinder'
import { parseProposalMessage } from '../services/messageParser'
import { TYPES } from '../types'

@injectable()
export class MessageHandler {
    private commandFinder: CommandFinder
    constructor(
        @inject(TYPES.CommandFinder) commandFinder: CommandFinder,
    ) {
        this.commandFinder = commandFinder
    }

    handle(message: Message): Promise<Message | Array<Message>> {
        if (this.commandFinder.isNewDaoMessage(message.content)) {
            const id = message.id
            const log = `DAO with ID ${id} is being crerated`

            // TODO: make a call to create a DAO 
            console.log(log) 
            return message.reply(log);
        } else if(this.commandFinder.isNewPropoosalMessage(message.content)) {
            // TODO(#5): handle create proposal command 

            // TODO: define proposal message structure and parse new proposal message
            const { channelId, messageId, proposaldeadline } = parseProposalMessage(message.content)
            // TODO: call createDataRequest with channelId and messageId

            // TODO: deploy data request when porposalDeadline is reached 
            return message.reply('')
        } else {
            return Promise.reject()
        }
    }
}