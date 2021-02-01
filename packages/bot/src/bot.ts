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
  Reaction
} from './types'
import { MessageHandler } from './services/messageHandler'

const defaulPositiveReactionList: Array<PositiveReaction> = [Reaction.ThumbsUp]
const defaultNegativeReactionList: Array<NegativeReaction> = [
  Reaction.ThumbsDown
]

// Bot logic
@injectable()
export class Bot {
  private client: Client
  private token: string
  private messageHandler: MessageHandler

  private loggedIn: string | undefined

  constructor (
    @inject(TYPES.Client) client: Client,
    @inject(TYPES.Token) token: string,
    @inject(TYPES.MessageHandler) messageHandler: MessageHandler
  ) {
    this.client = client
    this.token = token
    this.messageHandler = messageHandler
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
    this.client.on('message', (message: Message) => {
      this.messageHandler.handle(message)
    })

    return this.login()
  }

  public async fetchReactions (
    id: string,
    channelId: string,
    positiveReactionList: Array<PositiveReaction> = defaulPositiveReactionList,
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

// DR

// create DAO
