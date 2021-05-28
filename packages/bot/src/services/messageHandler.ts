import { Message } from 'discord.js'
import { inject, injectable } from 'inversify'
import { parseProposalMessage } from './parseProposalMessage'
import { parseSetupMessage } from './parseSetupMessage'
import { CommandFinder } from './commandFinder'
import {
  TYPES,
  RequestMessage,
  DaoDirectory,
  Proposal,
  Setup,
  EthUnits
} from '../types'
import { SubgraphClient } from './subgraph'
import { EmbedMessage } from './embedMessage'
import { ProposalRepository, SetupRepository } from '../database'
import {
  handleScheduleDataRequestResult,
  scheduleDataRequest,
  reportAndExecute,
  executeVotingResultAndHandleResponse
} from './scheduleDataRequest'
import { longSetTimeout } from '../utils/longSetTimeout'
import { defaultMinimumProposalDeadline } from '../constants'
import { convertEthUnits } from '../utils/convertEthUnits'
import { ExecuteError, ScheduleError } from '../error'
import { parseRetryMessage } from './parseRetryMessage'

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
      } else if (this.commandFinder.isReExecuteMessage(message.content)) {
        return this.reExecute(message)
      } else if (this.commandFinder.isReScheduleMessage(message.content)) {
        return this.reSchedule(message)
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
      proposalDescription,
      proposalAction
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

    if (message.channel.id !== this.initialSetup.channelId) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: You are trying to create a proposal in the wrong channel`,
          description: `You can only create proposals in the channel where the Aragon Govern integration has been setup for the last time (#${this.initialSetup.channelName})`
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
      return (
        `<@&${role.id}>` === this.initialSetup?.role ||
        this.initialSetup?.role === '@everyone'
      )
    })

    if (this.initialSetup.role && !isAllowed) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Sorry, you are not allowed to create a proposal`,
          description: `Only administrators can change permissions.`
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
          description: `The proposal should follow this format:\n \`!proposal yyyy/MM/dd HH:mm:ss <description> to:<address> value:<ETH> data?:<data>\``
        })
      )
    }

    if (!proposalAction.to) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: You need to set an address for the proposal action`,
          description: `The proposal should follow this format:\n'\`!proposal yyyy/MM/dd HH:mm:ss <description> to:<address> value:<ETH> data?:<data>'\``
        })
      )
    } else if (!proposalAction.value) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: You need to set a value for the proposal action`,
          description: `The proposal should follow this format:\n'\`!proposal yyyy/MM/dd HH:mm:ss <description> to:<address> value:<ETH> data?:<data>'\``
        })
      )
    }

    const minimalProposalDeadline =
      process.env.MINIMUM_PROPOSAL_DEADLINE || defaultMinimumProposalDeadline

    if (!proposalDeadlineTimestamp) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Invalid deadline`,
          description: `Please try again with a valid deadline. The proposal should follow this format:\n'\`!proposal yyyy/MM/dd HH:mm:ss <description> to:<address> value:<ETH> data?:<data>'\``
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
    } else if (proposalDeadlineTimestamp < minimalProposalDeadline) {
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
          amount: convertEthUnits({
            value: proposalAction.value,
            input: EthUnits.wei,
            output: EthUnits.eth
          }),
          address: proposalAction.to,
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
        proposalDescription,
        proposalAction
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

      this.saveProposal({
        messageId,
        channelId,
        guildId,
        description: proposalDescription,
        createdAt: currentTime,
        deadline: proposalDeadlineTimestamp,
        daoName: dao.name,
        action: proposalAction,
        executeError: false,
        scheduleError: false
      })

      longSetTimeout(() => {
        scheduleDataRequest(this.embedMessage)(
          {
            channelId,
            messageId,
            message,
            dao,
            proposalDescription,
            proposalAction
          },
          (
            error: ExecuteError | ScheduleError | Error | null,
            _,
            drTxHash?: string
          ) =>
            handleScheduleDataRequestResult(this.proposalRepository)(
              error,
              messageId,
              drTxHash
            )
        )

        this.requestMessage = null
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
        this.setupRepository.updateOnly(setup)
        console.log('[MessageHandler]: Setup updated', setup)
      } catch (error) {
        // TODO. handle error
        console.log('Error saving setup', setup)
      }
    } else {
      try {
        this.setupRepository.insert(setup)
        console.log('[MessageHandler]: Setup inserted', setup)
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
    const roles = message.guild?.roles.cache.map(role => `<@&${role.id}>`)
    const rolesName = message.guild?.roles.cache.map(role => role.name)
    const roleOptions = `Select one of the following roles: \`${rolesName?.join(
      '`, `@'
    )}\`. Make sure you are following this format \`!setup theNameOfYourDao userRole\``
    // Make sure a DAO name has been provided
    if (!daoName) {
      return message.reply(
        this.embedMessage.warning({
          title: 'The setup command should follow this format:',
          description: `\`!setup theNameOfYourDao userRole\`\n Only users with the selected role will be able to create proposals. The roles available are: \`${rolesName?.join(
            '`, `@'
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
    let dao
    try {
      dao = await this.subgraphClient.queryDaoByName(daoName)
    } catch (e) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Sorry, an error ocurred trying to register a DAO named "${daoName}"`
        })
      )
    }

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

    if (!roles?.includes(roleAllowed) && roleAllowed !== '@everyone') {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Please select the role of the users allowed to create proposals`,
          description: roleOptions
        })
      )
    }

    // Keep track of the Discord server <> DAO name relation
    this.daoDirectory[guildId] = dao
    const channelId = message.channel.id
    const channelName =
      message.guild?.channels.cache.get(message.channel.id)?.name || ''
    this.saveSetup({
      daoName,
      role: roleAllowed,
      guildId,
      channelId,
      channelName
    })
    await message.reply(
      '@everyone',
      this.embedMessage.dao({ daoName, role: roleAllowed, executorAddress: dao.executor.address })
    )

    const role = message.guild?.roles.cache.find(role => {
      return `<@&${role.id}>` === roleAllowed
    })
    return message.channel.send(
      `@everyone`,
      this.embedMessage.proposalInstructions({
        daoName,
        role: role ? `@${role.name}` : roleAllowed
      })
    )
  }

  private async reSchedule (message: Message) {
    const { messageId, gasPrice } = parseRetryMessage(message)

    if (!messageId) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: proposal_id not found`,
          description: `You have to specify the proposal_id of the proposal`
        })
      )
    }

    const proposal = await this.proposalRepository.getProposalByMessageId(
      messageId
    )

    if (!message.member?.hasPermission('ADMINISTRATOR')) {
      this.embedMessage.warning({
        title: `:warning: Sorry, you are not allowed to reSchedule a proposal`,
        description: `Only administrators can do that.`
      })
    }

    if (!proposal) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Message not found`,
          description: `There isn't a proposal with id: ${messageId}`
        })
      )
    }

    if (gasPrice && !isValidGasPrice(gasPrice)) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: Invalid format`,
          description: `The gas price should be a number in wei`
        })
      )
    }

    const dao = this.daoDirectory[proposal.guildId]

    if (proposal.scheduleError) {
      if (proposal.drTxHash) {
        this.proposalRepository.setDrTxHash(messageId, proposal.drTxHash)
        const report = await reportAndExecute(this.embedMessage)(
          {
            dao,
            drTxHash: proposal.drTxHash,
            proposalAction: proposal.action,
            message,
            proposalDescription: proposal.description,
            gasPrice: gasPrice || undefined,
            messageId: messageId
          },
          (error: ScheduleError | ExecuteError | null, _, drTxHash?: string) =>
            handleScheduleDataRequestResult(this.proposalRepository)(
              error,
              messageId,
              drTxHash
            )
        )

        if (report) {
          this.proposalRepository.setScheduleReport(messageId, report)
        }
      } else {
        return message.reply(
          this.embedMessage.warning({
            title: `:warning: Data Request failed`,
            description: `This proposal doesn't have associated a data request transaction hash`
          })
        )
      }
    } else {
      this.embedMessage.warning({
        title: `:warning: No schedule error found`,
        description: `It must exist a schedule error before call reSchedule`
      })
    }

    return undefined
  }

  private async reExecute (message: Message) {
    const { messageId } = parseRetryMessage(message)

    if (!messageId) {
      return message.reply(
        this.embedMessage.warning({
          title: `:warning: proposal_id not found`,
          description: `You have to specify the proposal_id of the proposal`
        })
      )
    }

    const proposal = await this.proposalRepository.getProposalByMessageId(
      messageId
    )

    const dao = this.daoDirectory[proposal.guildId]
    if (proposal.executeError) {
      if (proposal.report) {
        executeVotingResultAndHandleResponse(this.embedMessage)(
          {
            dao,
            message,
            proposalDescription: proposal.description,
            report: proposal.report,
            messageId
          },
          (
            error: ExecuteError | ScheduleError | null,
            _result: any,
            drTxHash?: string
          ) =>
            handleScheduleDataRequestResult(this.proposalRepository)(
              error,
              messageId,
              drTxHash
            )
        )
      } else {
        this.embedMessage.warning({
          title: `:warning: No execute error found`,
          description: `It must exist a execute error before call reExecute`
        })
      }
    } else {
      this.embedMessage.warning({
        title: `:warning: No execute error found`,
        description: `It must exist a execute error before call reExecute`
      })
    }

    return undefined
  }
}

function isValidGasPrice (gasPrice: string) {
  return gasPrice.match(/^[0-9]+$/)
}
