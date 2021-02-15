import {
  Channel,
  Client,
  Collection,
  Message,
  MessageReaction,
  TextChannel
} from 'discord.js'
import { inject, injectable } from 'inversify'
import {
  TYPES,
  ReactionCount,
  PositiveReaction,
  NegativeReaction,
  Reaction,
  Proposal
} from './types'

import { RegistryEntry } from './services/subgraph/types'

import { MessageHandler } from './services/messageHandler'
import { ProposalRepository } from './database'
import { scheduleDataRequest } from './services/scheduleDataRequest'
import { SubgraphClient } from './services/subgraph'
import { EmbedMessage } from './services/embedMessage'
import { longSetTimeout } from './utils/longSetTimeout'

const defaultPositiveReactionList: Array<PositiveReaction> = [Reaction.ThumbsUp]
const defaultNegativeReactionList: Array<NegativeReaction> = [
  Reaction.ThumbsDown
]

// Bot logic
@injectable()
export class Bot {
  private client: Client
  private token: string
  private messageHandler: MessageHandler
  private proposalRepository: ProposalRepository
  private subgraphClient: SubgraphClient
  private embedMessage: EmbedMessage

  private loggedIn: string | undefined

  constructor (
    @inject(TYPES.Client) client: Client,
    @inject(TYPES.Token) token: string,
    @inject(TYPES.MessageHandler) messageHandler: MessageHandler,
    @inject(TYPES.ProposalRepository) proposalRepository: ProposalRepository,
    @inject(TYPES.SubgraphClient) subgraphClient: SubgraphClient,
    @inject(TYPES.EmbedMessage) embedMessage: EmbedMessage
  ) {
    this.client = client
    this.token = token
    this.messageHandler = messageHandler
    this.proposalRepository = proposalRepository
    this.subgraphClient = subgraphClient
    this.embedMessage = embedMessage
  }

  private async login (): Promise<string> {
    // TODO: refresh call when necessary
    // only call login if it has not been called before
    if (!this.loggedIn) {
      this.loggedIn = await this.client.login(this.token)
    }

    return this.loggedIn
  }

  public listen (): Promise<string> {
    console.log('[BOT]: Listening discord server')

    this.proposalRepository.createTable()

    this.client.on('message', (message: Message) => {
      this.messageHandler.handle(message)
    })

    this.client.on('messageReactionAdd', async (reaction, user) => {
      let messageId = reaction.message.id
      this.proposalRepository
        .getActives()
        .then(async (proposals: Array<Proposal>) => {
          const isActiveProposal = proposals.find(proposal => {
            return proposal.messageId === messageId
          })
          if (!isActiveProposal) {
            await reaction.users.remove(user.id)
          }
        })
    })

    return this.login()
  }

  public loadActiveProposals () {
    this.proposalRepository.getActives().then((proposals: Array<Proposal>) => {
      let dao: RegistryEntry | null
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
              scheduleDataRequest(this.embedMessage)(
                proposal.channelId,
                proposal.messageId,
                message,
                dao,
                proposal.description
              )
            }
          }, proposal.deadline - Date.now())
        }
      })
    })
  }

  public async fetchReactions (
    id: string,
    channelId: string,
    positiveReactionList: Array<PositiveReaction> = defaultPositiveReactionList,
    negativeReactionList: Array<NegativeReaction> = defaultNegativeReactionList
  ): Promise<ReactionCount> {
    await this.login()

    const channel: Channel | undefined = await this.client.channels.fetch(
      channelId
    )
    if (channel && channel.type === 'text') {
      const textChannel: TextChannel = channel as TextChannel
      const message = await textChannel.messages.fetch(id)
      const reactions = message.reactions.cache

      const votes = {
        positive: countReactions(positiveReactionList, reactions),
        negative: countReactions(negativeReactionList, reactions)
      }

      console.log('Voting result:', votes)

      return Promise.resolve(votes)
    } else {
      return Promise.reject("Channel ID doesn't correspond to a ChannelText")
    }
  }
}

function countReactions (
  emojiList: Array<string>,
  reactions: Collection<string, MessageReaction>
) {
  return emojiList
    .map((emoji: string) => reactions.get(emoji)?.count || 0)
    .reduce((a: number, b: number) => a + b)
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
