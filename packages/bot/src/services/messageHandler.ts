import { Message } from 'discord.js'
import { inject, injectable } from 'inversify'
import { parseProposalMessage } from './parseProposalMessage'
import { parseSetupMessage } from './parseSetupMessage'
import { CommandFinder } from './commandFinder'
import { TYPES, RequestMessage, DaoDirectory, Proposal } from '../types'
import { SubgraphClient } from './subgraph'
import { EmbedMessage } from './embedMessage'
import { ProposalRepository } from '../database'
import { scheduleDataRequest } from './scheduleDataRequest'

@injectable()
export class MessageHandler {
  private commandFinder: CommandFinder
  private subgraphClient: SubgraphClient
  private daoDirectory: DaoDirectory
  public requestMessage: RequestMessage | null
  private embedMessage: EmbedMessage
  private proposalRepository: ProposalRepository

  constructor (
    @inject(TYPES.CommandFinder) commandFinder: CommandFinder,
    @inject(TYPES.EmbedMessage) embedMessage: EmbedMessage,
    @inject(TYPES.ProposalRepository) proposalRepository: ProposalRepository,
    @inject(TYPES.SubgraphClient) subgraphClient: SubgraphClient
  ) {
    this.commandFinder = commandFinder
    this.embedMessage = embedMessage
    this.daoDirectory = {}
    this.requestMessage = null
    this.subgraphClient = subgraphClient
    this.proposalRepository = proposalRepository
  }

  handle (message: Message): Promise<Message | Array<Message>> | undefined {
    if (!message.author.bot) {
      if (this.commandFinder.isSetupMessage(message.content)) {
        return this.setup(message)
      } else if (this.commandFinder.isNewDaoMessage(message.content)) {
        return MessageHandler.newDao(message)
      } else if (this.commandFinder.isNewProposalMessage(message.content)) {
        return this.newProposal(message)
      } else {
        return
      }
    } else {
      message.embeds.forEach(embed => {
        if (this.commandFinder.isProposalMessage(embed.title || '')) {
          return this.newDataRequest(message)
        } else {
          return
        }
      })
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
    this.requestMessage = parseProposalMessage(message)
    // define proposal message structure and parse new proposal message
    const {
      guildId,
      proposalDeadlineDate,
      proposalDeadlineTimestamp,
      messageId,
      proposalDescription
    } = this.requestMessage
    const currentTime = Date.now()

    console.log(
      '[BOT]:' +
        `Received a request for creating a proposal with message_id='${messageId}' and deadline=${proposalDeadlineDate}`
    )

    // Prevent this method from being called privately
    if (!guildId) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Sorry, this method can't be used in direct messaging`,
          description: `Please use it in a channel.`
        })
      )
    }

    const dao = this.daoDirectory[guildId]
    if (!dao) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Sorry, this DAO isn't connected yet to any DAO.`,
          description:
            `Please connect it to a DAO using the \`!setup\` command like this:` +
            `\n\`!setup theNameOfYourDao\``
        })
      )
    }

    if (!proposalDescription) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Invalid format`,
          description: `The proposal should follow this format:\n'\`!proposal [yyyy MM dd HH:mm:ss] [message]'\``
        })
      )
    }

    if (proposalDeadlineTimestamp <= currentTime) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: The entered deadline for the voting period is already past`,
          description: 'Please try again with a future date and time.'
        })
      )
    } else {
      return message.channel.send(
        '@everyone',
        this.embedMessage.proposal({
          proposalDescription,
          proposalDeadlineDate,
          footerMessage: `@${message.author.username}`,
          authorUrl: message.author.displayAvatarURL()
        })
      )
    }
  }

  private newDataRequest (message: Message) {
    // define proposal message structure and parse new proposal message
    if (this.requestMessage) {
      const {
        channelId,
        guildId,
        proposalDeadlineTimestamp,
        proposalDescription
      } = this.requestMessage
      const currentTime = Date.now()
      const messageId = message.id
      // Prevent this method from being called privately
      if (!guildId) {
        return message.reply(
          this.embedMessage.warning({
            title: `:warning: Sorry, this method can't be used in direct messaging`,
            description: `Please use it in a channel.`,
            footerMessage: `Proposal ${proposalDescription}`,
            authorUrl: message.author.displayAvatarURL()
          })
        )
      }

      const dao = this.daoDirectory[guildId]

      // TODO: Handle error saving proposal
      this.saveProposal({
        messageId,
        channelId,
        guildId,
        description: proposalDescription,
        createdAt: currentTime,
        deadline: proposalDeadlineTimestamp,
        daoName: this.daoDirectory[guildId].name 
      })

      // call createDataRequest with channelId and messageId
      setTimeout(() => {
        scheduleDataRequest(this.embedMessage)(channelId, messageId, message, dao, proposalDescription)

        this.requestMessage = null
        // TODO: it can overflow if the proposal is scheduled far in the future.
      }, proposalDeadlineTimestamp - currentTime)
      return
    } else {
      return
    }
  }

  private saveProposal (proposal: Proposal) {
    try {
      this.proposalRepository.insert(proposal)
    } catch (error) {
      // TODO. handle error
      console.log('Error saving proposal', proposal)
    }
  }

  private async setup (message: Message): Promise<Message> {
    const { daoName, guildId, requester } = parseSetupMessage(message)
    console.log(
      `Received setup request for Discord guild ${guildId} trying to integrate with DAO named "${daoName}"`
    )

    // Make sure a DAO name has been provided
    if (!daoName) {
      return message.reply(
        this.embedMessage.warning({
          title: 'The setup command should follow this format:',
          description: `\`!setup theNameOfYourDao\``
        })
      )
    }

    // Reject requests from non-admin users
    if (!requester?.hasPermission('ADMINISTRATOR')) {
      return message.reply(
        this.embedMessage.warning({
          title: `Sorry, only users with Admin permission are allowed to setup this integration.`
        })
      )
    }

    // Prevent this method from being called privately
    if (!guildId) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Sorry, this method can't be used in direct messaging.`,
          description: `Please use it in a channel.`
        })
      )
    }

    // Make sure that the DAO name exists in the Aragon Govern subgraph
    const dao = await this.subgraphClient.queryDaoByName(daoName)
    if (!dao) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Sorry, couldn't find a registered DAO named "${daoName}"`
        })
      )
    }

    // Keep track of the Discord server <> DAO name relation
    this.daoDirectory[guildId] = dao
    return message.reply('@everyone', this.embedMessage.dao({ daoName }))
  }
}
