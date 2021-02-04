import { Message } from 'discord.js'
import { inject, injectable } from 'inversify'
import { createDataRequest } from './createDataRequest'
import { parseProposalMessage } from './parseProposalMessage'
import { CommandFinder } from './commandFinder'
import { TYPES } from '../types'
import { sendRequestToWitnetNode } from '../nodeMethods/sendRequestToWitnetNode'
import { waitForTally } from '../nodeMethods/waitForTally'

@injectable()
export class MessageHandler {
  private commandFinder: CommandFinder

  constructor (@inject(TYPES.CommandFinder) commandFinder: CommandFinder) {
    this.commandFinder = commandFinder
  }

  handle (message: Message): Promise<Message | Array<Message>> | undefined {
    if (!message.author.bot) {
      if (this.commandFinder.isNewDaoMessage(message.content)) {
        return MessageHandler.newDao(message)
      } else if (this.commandFinder.isNewProposalMessage(message.content)) {
        return this.newProposal(message)
      } else {
        return
      }
    } else {
      return
    }
  }

  private static newDao (message: Message): Promise<Message> {
    const id = message.id
    const log = `DAO with ID ${id} is being created`
    // TODO: make a call to create a DAO
    return message.reply(log)
  }

  private newProposal (message: Message): Promise<Message> {
    // define proposal message structure and parse new proposal message
    const {
      channelId,
      messageId,
      proposalDeadline,
      proposalMessage
    } = parseProposalMessage(message)
    const deadline = Date.parse(proposalDeadline)
    const currentTime = Date.now()

    const id = message.id
    const log = `Proposal with ID ${id} is being created. The time for voting will end on ${new Date(
      deadline
    )}`
    console.log('[BOT]:' + log)

    // TODO: make a call to create a DAO
    if (!proposalMessage) {
      return message.reply(
        `The proposal should follow this format:\n'\`!proposal [MM dd yyyy HH:mm:ss] [message]'\``
      )
    } else if (deadline <= currentTime) {
      return message.reply(
        `The entered deadline for the voting period is already past. Please try again with a future date and time.`
      )
    } else {
      // call createDataRequest with channelId and messageId
      setTimeout(() => {
        console.log(
          `Creating Witnet data request for channelId ${channelId} and messageId ${messageId}`
        )
        const request = createDataRequest(channelId, messageId)
        console.log('Created Witnet data request:', request)

        sendRequestToWitnetNode(
          request,
          (drTxHash: string) => {
            console.log('Request sent to Witnet node, drTxHash: ', drTxHash)
            waitForTally(
              drTxHash,
              (tally: any) => {
                //TODO: Send tally.tally to contract
                console.log('Found tally for dr ', drTxHash, ': ', tally)
              },
              () => {}
            )
          },
          () => {}
        )
        // TODO: it can overflow if the proposal is scheduled far in the future.
      }, deadline - currentTime)
      return message.reply(log)
    }
  }
}
