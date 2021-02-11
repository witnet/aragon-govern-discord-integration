import { Message } from 'discord.js'
import { inject, injectable } from 'inversify'
import { createDataRequest } from './createDataRequest'
import { parseProposalMessage } from './parseProposalMessage'
import { parseSetupMessage } from './parseSetupMessage'
import { CommandFinder } from './commandFinder'
import { TYPES, RequestMessage, DaoDirectory } from '../types'
import { sendRequestToWitnetNode } from '../nodeMethods/sendRequestToWitnetNode'
import { waitForTally } from '../nodeMethods/waitForTally'
import { SubgraphClient } from './subgraph'
import { reportVotingResult } from './reportVotingResult'
import { executeVotingResult } from './executeVotingResult'
import { EmbedMessage } from './embedMessage'

const embedMessage = new EmbedMessage()

@injectable()
export class MessageHandler {
  private commandFinder: CommandFinder
  private subgraphClient: SubgraphClient
  private daoDirectory: DaoDirectory
  public requestMessage: RequestMessage | null

  constructor (@inject(TYPES.CommandFinder) commandFinder: CommandFinder) {
    this.commandFinder = commandFinder
    this.subgraphClient = new SubgraphClient()
    this.daoDirectory = {}
    this.requestMessage = null
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
  //
  private newProposal (message: Message): Promise<Message> {
    this.requestMessage = parseProposalMessage(message)
    // define proposal message structure and parse new proposal message
    const {
      guildId,
      proposalDeadlineDate,
      proposalDeadlineTimestamp,
      messageId,
      proposalMessage
    } = this.requestMessage
    const currentTime = Date.now()

    console.log(
      '[BOT]:' +
        `Received a request for creating a proposal with message_id='${messageId}' and deadline=${proposalDeadlineDate}`
    )

    // Prevent this method from being called privately
    if (!guildId) {
      return message.reply(
        embedMessage.warning({
          title: `:warning: Sorry, this method can't be used in direct messaging`,
          description: `Please use it in a channel.`
        })
      )
    }

    const dao = this.daoDirectory[guildId]
    if (!dao) {
      return message.reply(
        embedMessage.warning({
          title: `:warning: Sorry, this DAO isn't connected yet to any DAO.`,
          description:
            `Please connect it to a DAO using the \`!setup\` command like this:` +
            `\n\`!setup theNameOfYourDao\``
        })
      )
    }

    if (!proposalMessage) {
      return message.reply(
        embedMessage.warning({
          title: `:warning: Invalid format`,
          description: `The proposal should follow this format:\n'\`!proposal [yyyy, MM, dd, HH:mm:ss] [message]'\``
        })
      )
    }

    if (proposalDeadlineTimestamp <= currentTime) {
      return message.reply(
        embedMessage.warning({
          title: `:warning: The entered deadline for the voting period is already past`,
          description: 'Please try again with a future date and time.'
        })
      )
    } else {
      return message.channel.send(
        '@everyone',
        embedMessage.proposal({
          proposalMessage,
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
        proposalMessage
      } = this.requestMessage
      const currentTime = Date.now()
      const messageId = message.id
      // Prevent this method from being called privately
      if (!guildId) {
        return message.reply(
          embedMessage.warning({
            title: `:warning: Sorry, this method can't be used in direct messaging`,
            description: `Please use it in a channel.`,
            footerMessage: `Proposal ${proposalMessage}`,
            authorUrl: message.author.displayAvatarURL()
          })
        )
      }

      const dao = this.daoDirectory[guildId]
      // call createDataRequest with channelId and messageId
      setTimeout(() => {
        message.channel.send(
          '@everyone',
          embedMessage.info({
            title: `:stopwatch: The time for voting the proposal: ***${proposalMessage}*** is over!`,
            description: `Creating Witnet data request...`,
            footerMessage: `Proposal ${proposalMessage}`,
            authorUrl: message.author.displayAvatarURL()
          })
        )
        console.log(
          `Creating Witnet data request for channelId ${channelId} and messageId ${messageId}`
        )
        const request = createDataRequest(channelId, messageId)
        console.log('Created Witnet data request:', request)

        sendRequestToWitnetNode(
          request,
          (drTxHash: string) => {
            console.log(
              `Data request sent to Witnet node, drTxHash: ${drTxHash}`
            )
            waitForTally(
              drTxHash,
              async (tally: any) => {
                console.log('Tallied proposal result:', tally.tally)
                const report = await reportVotingResult(
                  dao,
                  drTxHash,
                  `${Math.round(Date.now() / 1000 + 60)}`
                )
                if (report) {
                  message.channel.send(
                    '@everyone',
                    embedMessage.info({
                      title: 'The data request result has been received',
                      description: `The ID of the data request ([${drTxHash}](https://witnet.network/search/${drTxHash})) has been reported to the Ethereum contract ([${report?.transactionHash}](https://rinkeby.etherscan.io/tx/${report?.transactionHash}))`,
                      footerMessage: `Proposal ${proposalMessage}`,
                      authorUrl: message.author.displayAvatarURL()
                    })
                  )
                } else {
                  message.channel.send(
                    '@everyone',
                    embedMessage.error({
                      title:
                        ':exclamation: There was an error reporting the proposal result',
                      footerMessage: `Proposal ${proposalMessage}`,
                      authorUrl: message.author.displayAvatarURL()
                    })
                  )
                }
                setTimeout(async () => {
                  const transactionHash = await executeVotingResult(
                    dao,
                    report?.payload
                  )
                  if (transactionHash) {
                    message.channel.send(
                      '@everyone',
                      embedMessage.info({
                        title: 'Proposal executed',
                        description: `The proposal has been executed in Ethereum transaction: [${transactionHash}](https://rinkeby.etherscan.io/tx/${transactionHash})`,
                        footerMessage: `Proposal ${proposalMessage}`,
                        authorUrl: message.author.displayAvatarURL()
                      })
                    )
                  } else {
                    message.channel.send(
                      '@everyone',
                      embedMessage.error({
                        title: `@everyone There was an error executing the proposal`,
                        footerMessage: `Proposal ${proposalMessage}`,
                        authorUrl: message.author.displayAvatarURL()
                      })
                    )
                  }
                }, 60000)
                this.requestMessage = null
              },
              () => {}
            )
          },
          () => {}
        )
        // TODO: it can overflow if the proposal is scheduled far in the future.
      }, proposalDeadlineTimestamp - currentTime)
      return
    } else {
      return
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
        embedMessage.warning({
          title: 'The setup command should follow this format:',
          description: `\`!setup theNameOfYourDao\``
        })
      )
    }

    // Reject requests from non-admin users
    if (!requester?.hasPermission('ADMINISTRATOR')) {
      return message.reply(
        embedMessage.warning({
          title: `Sorry, only users with Admin permission are allowed to setup this integration.`
        })
      )
    }

    // Prevent this method from being called privately
    if (!guildId) {
      return message.reply(
        embedMessage.warning({
          title: `:warning: Sorry, this method can't be used in direct messaging.`,
          description: `Please use it in a channel.`
        })
      )
    }

    // Make sure that the DAO name exists in the Aragon Govern subgraph
    const dao = await this.subgraphClient.queryDaoByName(daoName)
    if (!dao) {
      return message.reply(
        embedMessage.warning({
          title: `:warning: Sorry, couldn't find a registered DAO named "${daoName}"`
        })
      )
    }

    // Keep track of the Discord server <> DAO name relation
    this.daoDirectory[guildId] = dao
    return message.reply('@everyone', embedMessage.dao({ daoName }))
  }
}
