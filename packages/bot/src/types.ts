import { RegistryEntry } from './services/subgraph/types'

export const TYPES = {
  Bot: Symbol('Bot'),
  Client: Symbol('Client'),
  Token: Symbol('Token'),
  MessageHandler: Symbol('MessageHandler'),
  CommandFinder: Symbol('CommandFinder'),
  Database: Symbol('Database'),
  ProposalRepository: Symbol('ProposalRepository'),
  SubgraphClient: Symbol('SubgraphClient'),
  EmbedMessage: Symbol('EmbedMessage')
}

// Maps guild IDs to DAOs
export interface DaoDirectory {
  [guildId: string]: RegistryEntry
}

// Maps guild IDs to DAOs
export type EmbedMessageParams = {
  title?: string
  description?: string
  proposalDescription?: string
  proposalDeadlineDate?: string
  authorUrl?: string
  footerMessage?: string
  daoName?: string
}

export type RequestMessage = {
  channelId: string
  guildId: string | undefined
  messageId: string
  proposalDeadlineTimestamp: number
  proposalDeadlineDate: string
  proposalDescription: string
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

export enum EtherscanUrl {
  development = 'rinkeby.etherscan.io',
  production = 'etherscan.io',
}

export interface Url {
  [key: string]: EtherscanUrl,
}

export type PositiveReaction = Reaction.ThumbsUp
export type NegativeReaction = Reaction.ThumbsDown

export type Proposal = {
  messageId: string
  channelId: string
  guildId: string
  description: string
  createdAt: number
  deadline: number
  daoName: string
}
