import { NegativeReaction, PositiveReaction, Reaction } from './types'

export const defaultPositiveReactions: Array<PositiveReaction> = [
  Reaction.ThumbsUp
]
export const defaultNegativeReactions: Array<NegativeReaction> = [
  Reaction.ThumbsDown
]

export const gasPriceEndpoint: string =
  'https://ethgasstation.info/api/ethgasAPI.json'

export const defaultMinimumProposalDeadline = Date.now() + 4 * 3600 * 1000
