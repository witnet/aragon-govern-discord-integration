import { RegistryEntry } from './services/subgraph/types'

export const TYPES = {
  Bot: Symbol('Bot'),
  Client: Symbol('Client'),
  Token: Symbol('Token'),
  MessageHandler: Symbol('MessageHandler'),
  CommandFinder: Symbol('CommandFinder'),
  Database: Symbol('Database'),
  ProposalRepository: Symbol('ProposalRepository'),
  SetupRepository: Symbol('SetupRepository'),
  SubgraphClient: Symbol('SubgraphClient'),
  EmbedMessage: Symbol('EmbedMessage'),
  ReactionHandler: Symbol('ReactionHandler')
}

// Maps guild IDs to DAOs
export interface DaoDirectory {
  [guildId: string]: RegistryEntry
}

export interface UnitConversionExponents {
  [input: string]: {
    [output: string]: number
  }
}

export enum EthUnits {
  eth = 'eth',
  gwei = 'gwei',
  wei = 'wei'
}

export type ProposalAction = {
  to: string
  value: string
  data: string
}

export type Setup = {
  role: string
  daoName: string
  guildId: string
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
  amount?: string
  address?: string
  role?: string
  result?: Result
}

export type Result = {
  positive: number
  negative: number
}

export type RequestMessage = {
  channelId: string
  guildId: string | undefined
  messageId: string
  proposalDeadlineTimestamp: number
  proposalDeadlineDate: string
  proposalDescription: string
  proposalAction: ProposalAction
}

export enum Command {
  NewDao = '!new',
  NewProposal = '!proposal',
  Setup = '!setup',
  Role = '!role'
}

export type ReactionCount = {
  negative: number
  positive: number
}

export enum ReactionEvent {
  Add = 'messageReactionAdd',
  Remove = 'messageReactionRemove'
}

export enum Reaction {
  ThumbsUp = '👍',
  ThumbsDown = '👎'
}

export enum EtherscanUrl {
  development = 'rinkeby.etherscan.io',
  production = 'etherscan.io'
}

export interface Url {
  [key: string]: EtherscanUrl
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
  action: ProposalAction
}
