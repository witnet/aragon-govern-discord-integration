import { Message } from 'discord.js'
import { ENVIRONMENT, DEFAULT_EXEC_TIME } from '../config'
import { reportVotingResult } from './reportVotingResult'
import { executeVotingResult } from './executeVotingResult'
import { createDataRequest } from './createDataRequest'
import { sendRequestToWitnetNode } from '../nodeMethods/sendRequestToWitnetNode'
import { waitForTally } from '../nodeMethods/waitForTally'
import { DaoEntry } from './subgraph/types'
import { EtherscanUrl, ProposalAction, Url } from '../types'
import { EmbedMessage } from './embedMessage'
import { countReactions } from './countReactions'
import { decodeTallyResult } from '../utils/decodeTally'
import { longSetTimeout } from '../utils/longSetTimeout'
import { formatDistance } from 'date-fns'

import {
  defaultPositiveReactions,
  defaultNegativeReactions
} from '../constants'

const etherscanUrl: Url = {
  development: EtherscanUrl.development,
  production: EtherscanUrl.production
}

export function scheduleDataRequest (embedMessage: EmbedMessage) {
  return async (
    channelId: string,
    messageId: string,
    message: Message,
    dao: DaoEntry,
    proposalDescription: string,
    proposalAction: ProposalAction
  ) => {
    const reactions = message.reactions.cache
    const votes = {
      positive: countReactions(defaultPositiveReactions, reactions),
      negative: countReactions(defaultNegativeReactions, reactions)
    }
    const resultMessage = await message.channel.send(
      '@everyone',
      embedMessage.result({
        title: `:stopwatch: The time for voting the proposal is over!`,
        description: `The proposal result will now be retrieved by the [Witnet decentralized oracle](https://www.witnet.io/). This process may take a few minutes. The result will be reported to the Aragon Govern DAO ***${dao.name}***.`,
        result: {
          positive: votes.positive,
          negative: votes.negative
        },
        footerMessage: `Proposal ${proposalDescription}`,
        authorUrl: message.author.displayAvatarURL()
      })
    )
    console.log(
      `Creating Witnet data request for channelId ${channelId} and messageId ${messageId}`
    )
    const request = createDataRequest(channelId, resultMessage.id)
    console.log('Created Witnet data request:', request)

    sendRequestToWitnetNode(
      request,
      (drTxHash: string) => {
        console.log(`Data request sent to Witnet node, drTxHash: ${drTxHash}`)
        waitForTally(
          drTxHash,
          async (tally: any) => {
            console.log('Tallied proposal result:', tally.tally)
            const decodedTally = decodeTallyResult(tally.tally)
            if (!decodedTally.positive && decodedTally.positive !== 0) {
              return message.channel.send(
                '@everyone',
                embedMessage.error({
                  title: `:exclamation: There was an error executing the Witnet data request`,
                  description: `You can check the Witnet transaction in the [block explorer](https://witnet.network/search/${drTxHash}).`,
                  footerMessage: `Proposal ${proposalDescription}`,
                  authorUrl: message.author.displayAvatarURL()
                })
              )
            }
            if (decodedTally.positive > decodedTally.negative) {
              const executionDelay = Number(dao.queue.config.executionDelay)
              const disputingTime = formatDistance(0, (executionDelay + DEFAULT_EXEC_TIME) * 1000, {
                includeSeconds: true
              })
              const report = await reportVotingResult(
                dao,
                drTxHash,
                `${Math.round(
                  Date.now() / 1000 + executionDelay + DEFAULT_EXEC_TIME
                )}`,
                proposalAction
              )
              if (report) {
                message.channel.send(
                  '@everyone',
                  embedMessage.info({
                    title: 'The proposal passed with a majority of votes',
                    description: `The proposed action has been scheduled in the ***${dao.name}*** Aragon Govern DAO (check the transaction on [Etherscan](https://${etherscanUrl[ENVIRONMENT]}/tx/${report?.transactionHash})). Unless disputed, the action will be executed in ${disputingTime}. The result of this voting was retrieved securely using the Witnet decentralized oracle, and can be verified on the [Witnet block explorer](https://witnet.network/search/${drTxHash}).`,
                    footerMessage: `Proposal ${proposalDescription}`,
                    authorUrl: message.author.displayAvatarURL()
                  })
                )
              } else {
                message.channel.send(
                  '@everyone',
                  embedMessage.error({
                    title: `:exclamation: There was an error reporting the result to the Aragon Govern DAO ***${dao.name}***`,
                    footerMessage: `Proposal ${proposalDescription}`,
                    authorUrl: message.author.displayAvatarURL()
                  })
                )
              }
              longSetTimeout(async () => {
                const transactionHash = await executeVotingResult(
                  dao,
                  report?.payload
                )
                if (transactionHash) {
                  message.channel.send(
                    '@everyone',
                    embedMessage.info({
                      title: 'The proposed action has been executed',
                      description: `The proposed action has been executed on Ethereum (check the transaction on [Etherscan](https://${etherscanUrl[ENVIRONMENT]}/tx/${transactionHash})).`,
                      footerMessage: `Proposal ${proposalDescription}`,
                      authorUrl: message.author.displayAvatarURL()
                    })
                  )
                } else {
                  message.channel.send(
                    '@everyone',
                    embedMessage.error({
                      title: `:exclamation: There was an error executing the proposed action in the Aragon Govern DAO ***${dao.name}***`,
                      footerMessage: `Proposal ${proposalDescription}`,
                      authorUrl: message.author.displayAvatarURL()
                    })
                  )
                }
              }, (executionDelay + DEFAULT_EXEC_TIME) * 1000)
            } else {
              return message.channel.send(
                '@everyone',
                embedMessage.info({
                  title: `The proposal did not receive a majority of positive votes`,
                  description: `The action will not be executed. The result of this voting was retrieved securely using the Witnet decentralized oracle, and can be verified on the [Witnet block explorer](https://witnet.network/search/${drTxHash}).`,
                  footerMessage: `Proposal ${proposalDescription}`,
                  authorUrl: message.author.displayAvatarURL()
                })
              )
            }
            return
          },
          () => {}
        )
      },
      () => {}
    )
  }
}
