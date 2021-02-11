import { RegistryEntry } from './services/subgraph/types'

export const TYPES = {
  Bot: Symbol('Bot'),
  Client: Symbol('Client'),
  Token: Symbol('Token'),
  MessageHandler: Symbol('MessageHandler'),
  CommandFinder: Symbol('CommandFinder')
}

// Maps guild IDs to DAOs
export interface DaoDirectory {
  [guildId: string]: RegistryEntry
}

export type RequestMessage = {
  channelId: string,
  guildId: string | undefined,
  messageId: string,
  proposalDeadlineTimestamp: number,
  proposalDeadlineDate: string,
  proposalMessage: string,
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
