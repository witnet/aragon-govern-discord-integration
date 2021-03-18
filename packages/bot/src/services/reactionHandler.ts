import { Message, MessageReaction, PartialUser, User } from 'discord.js'
import { inject, injectable } from 'inversify'
import { TYPES, ReactionEvent, Reaction } from '../types'
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

  async handle (
    reaction: MessageReaction,
    user: User | PartialUser,
    reactionEvent: ReactionEvent
  ): Promise<Message | Array<Message> | undefined> {
    const activeProposal = await this.proposalRepository.getActive(
      reaction.message.id
    )
    const isVotingReaction =
      reaction.emoji.name === Reaction.ThumbsUp ||
      reaction.emoji.name === Reaction.ThumbsDown
    if (activeProposal && isVotingReaction) {
      if (reactionEvent === ReactionEvent.Add) {
        return reaction.message.reply(
          this.embedMessage.info({
            title: `@${user.username} has reacted with ${reaction.emoji}`,
            footerMessage: `proposal ${activeProposal.description}`,
            authorUrl: user.displayAvatarURL()
          })
        )
      }
      if (reactionEvent === ReactionEvent.Remove) {
        return reaction.message.reply(
          this.embedMessage.info({
            title: `@${user.username} has removed their reaction: ${reaction.emoji}`,
            footerMessage: `proposal ${activeProposal.description}`,
            authorUrl: user.displayAvatarURL()
          })
        )
      }
      return
    } else {
      return
    }
  }
}
