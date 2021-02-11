import Discord, { Message } from 'discord.js'
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

const validationWarning = new Discord.MessageEmbed().setColor('#d09625')
const errorMessage = new Discord.MessageEmbed().setColor('#b9182f')

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
        validationWarning
          .setTitle(
            `:warning: Sorry, this method can't be used in direct messaging`
          )
          .setDescription(`Please use it in a channel.`)
      )
    }

    const dao = this.daoDirectory[guildId]
    if (!dao) {
      return message.reply(
        validationWarning
          .setTitle(`:warning: Sorry, this DAO isn't connected yet to any DAO.`)
          .setDescription(
            `Please connect it to a DAO using the \`!setup\` command like this:` +
              `\n\`!setup theNameOfYourDao\``
          )
      )
    }

    if (!proposalMessage) {
      return message.reply(
        validationWarning
          .setTitle(`:warning: Invalid format`)
          .setDescription(
            `The proposal should follow this format:\n'\`!proposal [yyyy, MM, dd, HH:mm:ss] [message]'\``
          )
      )
    }

    if (proposalDeadlineTimestamp <= currentTime) {
      return message.reply(
        validationWarning
          .setTitle(
            `:warning: The entered deadline for the voting period is already past`
          )
          .setDescription('Please try again with a future date and time.')
      )
    } else {
      const proposalEmbedMessage = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`New proposal ***${proposalMessage}***`)
        .setURL(message.author.avatarURL() || '')
        .setDescription(
          `The request for creating the proposal ***${proposalMessage}*** has been received. React to this proposal to vote!`
        )
        .setThumbnail('attachment://aragon.png')
        .addFields(
          { name: 'Vote yes', value: ':thumbsup:', inline: true },
          { name: 'Vote no', value: ':thumbsdown:', inline: true },
          {
            name: 'The time for voting will end on',
            value: `${proposalDeadlineDate}`
          }
        )
        .setTimestamp()
        .setFooter(
          `@${message.author.username}`,
          message.author.displayAvatarURL()
        )
      return message.channel.send('@everyone', {
        embed: proposalEmbedMessage,
        files: [
          {
            attachment: 'src/static/aragon.png',
            name: 'aragon.png'
          }
        ]
      })
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
          validationWarning
            .setTitle(
              `:warning: Sorry, this method can't be used in direct messaging`
            )
            .setDescription(`Please use it in a channel.`)
            .setFooter(
              `Proposal ${proposalMessage}`,
              message.author.displayAvatarURL()
            )
        )
      }

      const dao = this.daoDirectory[guildId]
      // call createDataRequest with channelId and messageId
      setTimeout(() => {
        message.channel.send(
          '@everyone',
          new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(
              `:stopwatch: The time for voting the proposal: ***${proposalMessage}*** is over!`
            )
            .setDescription(`Creating Witnet data request...`)
            .setFooter(
              `Proposal ${proposalMessage}`,
              message.author.displayAvatarURL()
            )
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
                    new Discord.MessageEmbed()
                      .setColor('#0099ff')
                      .setTitle('The data request result has been received')
                      .setDescription(
                        `The ID of the data request ([${drTxHash}](https://witnet.network/search/${drTxHash})) has been reported to the Ethereum contract ([${report?.transactionHash}](https://rinkeby.etherscan.io/tx/${report?.transactionHash}))`
                      )
                      .setFooter(
                        `Proposal ${proposalMessage}`,
                        message.author.displayAvatarURL()
                      )
                  )
                } else {
                  message.channel.send(
                    '@everyone',
                    errorMessage
                      .setTitle(
                        ':exclamation: There was an error reporting the proposal result'
                      )
                      .setFooter(
                        `Proposal ${proposalMessage}`,
                        message.author.displayAvatarURL()
                      )
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
                      new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle('Proposal executed')
                        .setDescription(
                          `The proposal has been executed in Ethereum transaction: [${transactionHash}](https://rinkeby.etherscan.io/tx/${transactionHash})`
                        )
                        .setFooter(
                          `Proposal ${proposalMessage}`,
                          message.author.displayAvatarURL()
                        )
                    )
                  } else {
                    message.channel.send(
                      '@everyone',
                      errorMessage
                        .setTitle(
                          `@everyone There was an error executing the proposal`
                        )
                        .setFooter(
                          `Proposal ${proposalMessage}`,
                          message.author.displayAvatarURL()
                        )
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
        validationWarning
          .setTitle('The setup command should follow this format:')
          .setDescription(`\`!setup theNameOfYourDao\``)
      )
    }

    // Reject requests from non-admin users
    if (!requester?.hasPermission('ADMINISTRATOR')) {
      return message.reply(
        validationWarning.setTitle(
          `Sorry, only users with Admin permission are allowed to setup this integration.`
        )
      )
    }

    // Prevent this method from being called privately
    if (!guildId) {
      return message.reply(
        validationWarning
          .setTitle(
            `:warning: Sorry, this method can't be used in direct messaging.`
          )
          .setDescription(`Please use it in a channel.`)
      )
    }

    // Make sure that the DAO name exists in the Aragon Govern subgraph
    const dao = await this.subgraphClient.queryDaoByName(daoName)
    if (!dao) {
      return message.reply(
        validationWarning.setTitle(
          `:warning: Sorry, couldn't find a registered DAO named "${daoName}"`
        )
      )
    }

    // Keep track of the Discord server <> DAO name relation
    this.daoDirectory[guildId] = dao
    const daoMessage = new Discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Congrats to you and your fellow Discord users!')
      .setDescription(
        `This server is now connected to the DAO named ***${daoName}***. **Remember to also add these other bots to your server**, otherwise the integration will fail:`
      )
      .setThumbnail('attachment://aragon.png')
      .addFields(
        {
          name: 'Witnet Foundation Reactions Monitor',
          value:
            '[Click to add >](https://discord.com/api/oauth2/authorize?client_id=806098500978343986&permissions=65536&scope=bot%20messages.read)',
          inline: true
        },
        {
          name: 'Aragon One Reactions Monitor',
          value:
            '[Click to add >](https://discord.com/api/oauth2/authorize?client_id=806819543460610068&permissions=65536&scope=bot%20messages.read)',
          inline: true
        },
        {
          name: 'OtherPlane Reactions Monitor',
          value:
            '[Click to add >](https://discord.com/api/oauth2/authorize?client_id=806821381844762625&permissions=65536&scope=bot%20messages.read)',
          inline: true
        }
      )
    return message.reply('@everyone', {
      embed: daoMessage,
      files: [
        {
          attachment: 'src/static/aragon.png',
          name: 'aragon.png'
        }
      ]
    })
  }
}
