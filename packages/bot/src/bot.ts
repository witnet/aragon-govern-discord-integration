import { Channel, Client, Message, TextChannel } from 'discord.js'
import { inject, injectable } from 'inversify'
import { TYPES, ReactionCount, Proposal, ReactionEvent } from './types'

import { DaoEntry } from './services/subgraph/types'

import { MessageHandler } from './services/messageHandler'
import { ProposalRepository, SetupRepository } from './database'
import {
  handleScheduleDataRequestResult,
  scheduleDataRequest
} from './services/scheduleDataRequest'
import { SubgraphClient } from './services/subgraph'
import { EmbedMessage } from './services/embedMessage'
import { ReactionHandler } from './services/reactionHandler'
import { longSetTimeout } from './utils/longSetTimeout'
import { ExecuteError, ScheduleError } from './error'
import { WitnetNodeClient } from './nodeMethods/WitnetNodeClient'
import { WITNET_NODE_HOST, WITNET_NODE_PORT } from './config'

// Bot logic
@injectable()
export class Bot {
  private client: Client
  private token: string
  private messageHandler: MessageHandler
  private proposalRepository: ProposalRepository
  private setupRepository: SetupRepository
  private subgraphClient: SubgraphClient
  private embedMessage: EmbedMessage
  private reactionHandler: ReactionHandler
  private loggedIn: string | undefined
  private witnetNodeClient: WitnetNodeClient

  constructor (
    @inject(TYPES.Client) client: Client,
    @inject(TYPES.Token) token: string,
    @inject(TYPES.MessageHandler) messageHandler: MessageHandler,
    @inject(TYPES.ProposalRepository) proposalRepository: ProposalRepository,
    @inject(TYPES.SetupRepository) setupRepository: SetupRepository,
    @inject(TYPES.SubgraphClient) subgraphClient: SubgraphClient,
    @inject(TYPES.ReactionHandler) reactionHandler: ReactionHandler,
    @inject(TYPES.EmbedMessage) embedMessage: EmbedMessage,
    @inject(TYPES.WitnetNodeClient) witnetNodeClient: WitnetNodeClient
  ) {
    this.client = client
    this.token = token
    this.messageHandler = messageHandler
    this.proposalRepository = proposalRepository
    this.setupRepository = setupRepository
    this.subgraphClient = subgraphClient
    this.embedMessage = embedMessage
    this.reactionHandler = reactionHandler
    this.witnetNodeClient = witnetNodeClient

    this.witnetNodeClient.connect(WITNET_NODE_PORT, WITNET_NODE_HOST, () => {})
  }

  private async login (): Promise<string> {
    // TODO: refresh call when necessary
    // only call login if it has not been called before
    if (!this.loggedIn) {
      this.loggedIn = await this.client.login(this.token)
    }

    return this.loggedIn
  }

  public async listen (): Promise<string> {
    console.log('[BOT]: Listening discord server')

    await this.proposalRepository.createTable()
    await this.setupRepository.createTable()
    this.client.on('message', (message: Message) => {
      this.messageHandler.handle(message)
    })

    this.client.on('messageReactionAdd', async (reaction, user) => {
      this.reactionHandler.handle(reaction, user, ReactionEvent.Add)
    })

    this.client.on('messageReactionRemove', async (reaction, user) => {
      this.reactionHandler.handle(reaction, user, ReactionEvent.Remove)
    })

    return this.login()
  }

  public loadActiveProposals () {
    this.proposalRepository.getActives().then((proposals: Array<Proposal>) => {
      let dao: DaoEntry | null
      let message: Message | null | void
      proposals.forEach((proposal: Proposal) => {
        if (!hasProposalExpired(proposal)) {
          longSetTimeout(async () => {
            dao = await this.subgraphClient.queryDaoByName(proposal.daoName)

            message = await getMessage(
              this.client,
              proposal.messageId,
              proposal.channelId
            )

            if (message && dao) {
              scheduleDataRequest(this.embedMessage, this.witnetNodeClient)(
                {
                  channelId: proposal.channelId,
                  messageId: proposal.messageId,
                  message,
                  dao,
                  proposalDescription: proposal.description,
                  proposalAction: proposal.action
                },

                (
                  error: ExecuteError | ScheduleError | Error | null,
                  _,
                  drTxHash?: string
                ) =>
                  handleScheduleDataRequestResult(this.proposalRepository)(
                    error,
                    proposal.messageId,
                    drTxHash
                  )
              )
            }
          }, proposal.deadline - Date.now())
        }
      })
    })
  }

  public async fetchReactions (
    id: string,
    channelId: string
  ): Promise<ReactionCount> {
    await this.login()

    const channel: Channel | undefined = await this.client.channels.fetch(
      channelId
    )
    if (channel && channel.type === 'text') {
      const textChannel: TextChannel = channel as TextChannel
      const message = await textChannel.messages.fetch(id)
      //TODO: improve parse votes when the final structure is implemented
      const votes = {
        positive: Number(message.embeds[0].fields[0].value) || 0,
        negative: Number(message.embeds[0].fields[1].value) || 0
      }
      console.log('Voting result:', votes)
      return Promise.resolve(votes)
    } else {
      return Promise.reject("Channel ID doesn't correspond to a ChannelText")
    }
  }
}

function hasProposalExpired (proposal: Proposal) {
  return proposal.deadline < Date.now()
}

function getMessage (
  loggedClient: Client,
  messageId: string,
  channelId: string
): Promise<Message | void | undefined> {
  return loggedClient.channels
    .fetch(channelId)
    .then((channel: Channel) => {
      if (channel.type === 'text') {
        return (channel as TextChannel).messages.fetch(messageId)
      } else {
        console.log('Provided channel is not TextChannel')
        throw Error('Provided channel is not TextChannel')
      }
    })
    .catch(console.error)
}
