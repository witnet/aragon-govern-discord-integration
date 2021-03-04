import { Message } from 'discord.js'
import { inject, injectable } from 'inversify'
import { parseProposalMessage } from './parseProposalMessage'
import { parseSetupMessage } from './parseSetupMessage'
import { CommandFinder } from './commandFinder'
import { TYPES, RequestMessage, DaoDirectory, Proposal, Setup } from '../types'
import { SubgraphClient } from './subgraph'
import { EmbedMessage } from './embedMessage'
import { ProposalRepository, SetupRepository } from '../database'
import { scheduleDataRequest } from './scheduleDataRequest'
import { longSetTimeout } from '../utils/longSetTimeout'

@injectable()
export class MessageHandler {
  private commandFinder: CommandFinder
  private subgraphClient: SubgraphClient
  private daoDirectory: DaoDirectory
  public initialSetup: Setup | null
  public requestMessage: RequestMessage | null
  public isUserAllowed: boolean
  private embedMessage: EmbedMessage
  private proposalRepository: ProposalRepository
  private setupRepository: SetupRepository

  constructor (
    @inject(TYPES.CommandFinder) commandFinder: CommandFinder,
    @inject(TYPES.EmbedMessage) embedMessage: EmbedMessage,
    @inject(TYPES.ProposalRepository) proposalRepository: ProposalRepository,
    @inject(TYPES.SetupRepository) setupRepository: SetupRepository,
    @inject(TYPES.SubgraphClient) subgraphClient: SubgraphClient
  ) {
    this.commandFinder = commandFinder
    this.embedMessage = embedMessage
    this.initialSetup = null
    this.daoDirectory = {}
    this.requestMessage = null
    this.isUserAllowed = false
    this.subgraphClient = subgraphClient
    this.proposalRepository = proposalRepository
    this.setupRepository = setupRepository
  }
  private async loadSetup () {
    const savedSetup = await this.setupRepository.getSetup()
    if (savedSetup) {
      const dao = await this.subgraphClient.queryDaoByName(savedSetup.daoName)
      if (dao) {
        this.daoDirectory[savedSetup.guildId] = dao
      }
      this.initialSetup = savedSetup
    }
  }

  async handle (
    message: Message
  ): Promise<Message | Array<Message> | undefined> {
    await this.loadSetup()
    if (!message.author.bot) {
      if (this.commandFinder.isSetupMessage(message.content)) {
        return this.setup(message)
      }
      if (this.commandFinder.isNewDaoMessage(message.content)) {
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

    if (!this.initialSetup) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Sorry, you need a setup to create proposals`,
          description:
            `Please create a setup as following: \`!setup\` command like this:` +
            `\n\`!setup theNameOfYourDao userRole\``
        })
      )
    }
    if (!this.initialSetup.role) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: You need to set the role of the users allowed to make proposals`,
          description: `\`!role admin\``
        })
      )
    }

    const isAllowed = message.member?.roles.cache.some(role => {
      console.log('role name', role.name)
      return role.name === this.initialSetup?.role
    })
    console.log('role initial', this.initialSetup?.role)

    if (this.initialSetup.role && !isAllowed) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Sorry, you are not allowed to create a proposal`,
          description: `Only administrators can change permissions`
        })
      )
    }

    // Prevent this method from being called privately
    if (!guildId) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Sorry, this method can't be used in direct messaging`,
          description: `Please use it in a channel.`
        })
      )
    }

    if (!this.initialSetup.daoName) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Sorry, this Discord server isn't connected yet to any DAO.`,
          description:
            `Please connect it to a DAO using the \`!setup\` command like this:` +
            `\n\`!setup theNameOfYourDao userRole\``
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
      // currentTimestamp + 4 hours
    } else if (proposalDeadlineTimestamp < Date.now() + 4 * 3600 * 1000) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: The proposal should be available to react for at least 4 hours`,
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
        daoName: dao.name
      })

      longSetTimeout(() => {
        scheduleDataRequest(this.embedMessage)(
          channelId,
          messageId,
          message,
          dao,
          proposalDescription
        )

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

  private async saveSetup (setup: Setup) {
    if (this.initialSetup) {
      try {
        console.log('setup update', setup)
        this.setupRepository.updateOnly(setup)
      } catch (error) {
        // TODO. handle error
        console.log('Error saving setup', setup)
      }
    } else {
      try {
        console.log('setup insert', setup)
        this.setupRepository.insert(setup)
      } catch (error) {
        // TODO. handle error
        console.log('Error saving setup', setup)
      }
    }
  }

  private async setup (message: Message): Promise<Message> {
    const { daoName, guildId, requester, roleAllowed } = parseSetupMessage(
      message
    )
    console.log(
      `Received setup request for Discord guild ${guildId} trying to integrate with DAO named "${daoName}"`
    )
    const roles = message.guild?.roles.cache.map(role => role.name)
    const roleOptions = `Select one of the following roles: \`${roles?.join(
      '`, `'
    )}\`. Make sure you are following this format \`!setup theNameOfYourDao userRole\``
    // Make sure a DAO name has been provided
    if (!daoName) {
      return message.reply(
        this.embedMessage.warning({
          title: 'The setup command should follow this format:',
          description: `\`!setup theNameOfYourDao userRole\`\n Only users with the selected role will be able to create proposals. The roles available are: \`${roles?.join(
            '`, `'
          )}\``
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

    if (!roleAllowed) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Please select the role of the users allowed to create proposals`,
          description: roleOptions
        })
      )
    }

    if (!roles?.includes(roleAllowed)) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Please select the role of the users allowed to create proposals`,
          description: roleOptions
        })
      )
    }

    // Keep track of the Discord server <> DAO name relation
    this.daoDirectory[guildId] = dao
    this.saveSetup({ daoName, role: roleAllowed, guildId })
    return message.reply(
      '@everyone',
      this.embedMessage.dao({ daoName, role: roleAllowed })
    )
  }
}
