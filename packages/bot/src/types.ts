export const TYPES = {
  Bot: Symbol('Bot'),
  Client: Symbol('Client'),
  Token: Symbol('Token'),
  MessageHandler: Symbol('MessageHandler'),
  CommandFinder: Symbol('CommandFinder')
}

export enum Command {
  NewDao = '!new',
  NewProposal = '!proposal',
  Setup = '!setup'
}

export type ReactionCount = {
  negative: number
  positive: number
}

export enum Reaction {
  ThumbsUp = '👍',
  ThumbsDown = '👎'
}

export type PositiveReaction = Reaction.ThumbsUp
export type NegativeReaction = Reaction.ThumbsDown
