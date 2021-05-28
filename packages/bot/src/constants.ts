import { NegativeReaction, PositiveReaction, Reaction } from './types'
import {
  EtherscanUrl,
  Url
} from './types'

import { ENVIRONMENT } from './config'

export const defaultPositiveReactions: Array<PositiveReaction> = [
  Reaction.ThumbsUp
]
export const defaultNegativeReactions: Array<NegativeReaction> = [
  Reaction.ThumbsDown
]

export const gasPriceEndpoint: string =
  'https://ethgasstation.info/api/ethgasAPI.json'

export const defaultMinimumProposalDeadline = Date.now() + 4 * 3600 * 1000

export const subgraphEndpoint =
  process.env.SUBGRAPH_ENDPOINT ||
  'https://api.thegraph.com/subgraphs/name/aragon/aragon-govern-rinkeby'

export const etherscanUrls: Url = {
  development: EtherscanUrl.development,
  production: EtherscanUrl.production
}

export const etherscanUrl = `https://${etherscanUrls[ENVIRONMENT]}`