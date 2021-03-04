import { Message, MessageReaction, PartialUser, User } from 'discord.js'
import { inject, injectable } from 'inversify'
import { TYPES, ReactionEvent } from '../types'
import { ProposalRepository } from '../database'
import { EmbedMessage } from './embedMessage'

@injectable()
export class ReactionHandler {
  private embedMessage: EmbedMessage
  private proposalRepository: ProposalRepository

  constructor (
    @inject(TYPES.EmbedMessage) embedMessage: EmbedMessage,
    @inject(TYPES.ProposalRepository) proposalRepository: ProposalRepository
  ) {
    this.embedMessage = embedMessage
    this.proposalRepository = proposalRepository
  }

  async handle (reaction: MessageReaction, user: User | PartialUser, reactionEvent: ReactionEvent): Promise<Message | Array<Message> | undefined> {
    const activeProposal = await this.proposalRepository.getActive(reaction.message.id)
    console.log(activeProposal)
    if (activeProposal) {
      if (reactionEvent === ReactionEvent.Add) {
        //TODO: add proposalDescription
        return reaction.message.reply(
          this.embedMessage.info({
            title: `User @${user.username} has reacted with ${reaction.emoji}`,
            footerMessage: `proposal ${activeProposal.description}`,
            authorUrl: user.displayAvatarURL()
          })
        )
      }
      if (reactionEvent === ReactionEvent.Remove) {
        //TODO: add proposalDescription
        return reaction.message.reply(
          this.embedMessage.info({
            title: `User @${user.username} has removed their reaction: ${reaction.emoji}`,
            footerMessage: `proposal ${activeProposal.description}`,
            authorUrl: user.displayAvatarURL()
          })
        )
      }
      return 
    } else {
      // TODO: send warn message
      return
    }
  }
}
