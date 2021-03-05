import { Message } from 'discord.js'
import { ENVIRONMENT } from '../config'
import { reportVotingResult } from './reportVotingResult'
import { executeVotingResult } from './executeVotingResult'
import { createDataRequest } from './createDataRequest'
import { sendRequestToWitnetNode } from '../nodeMethods/sendRequestToWitnetNode'
import { waitForTally } from '../nodeMethods/waitForTally'
import { RegistryEntry } from './subgraph/types'
import { EtherscanUrl, Url } from '../types'
import { EmbedMessage } from './embedMessage'
import { countReactions } from './countReactions'
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
    dao: RegistryEntry,
    proposalDescription: string
  ) => {
    const reactions = message.reactions.cache
    const votes = {
      positive: countReactions(defaultPositiveReactions, reactions),
      negative: countReactions(defaultNegativeReactions, reactions)
    }
    const resultMessage = await message.channel.send(
      '@everyone',
      embedMessage.result({
        title: `:stopwatch: The time for voting the proposal: ***${proposalDescription}*** is over!`,
        description: `Creating Witnet data request...`,
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
            const report = await reportVotingResult(
              dao,
              drTxHash,
              `${Math.round(Date.now() / 1000 + 60)}`
            )
            if (report) {
              message.channel.send(
                '@everyone',
                embedMessage.info({
                  title: 'The data request result has been received',
                  description: `The ID of the data request ([${drTxHash}](https://witnet.network/search/${drTxHash})) has been reported to the Ethereum contract ([${report?.transactionHash}](https://${etherscanUrl[ENVIRONMENT]}/tx/${report?.transactionHash}))`,
                  footerMessage: `Proposal ${proposalDescription}`,
                  authorUrl: message.author.displayAvatarURL()
                })
              )
            } else {
              message.channel.send(
                '@everyone',
                embedMessage.error({
                  title:
                    ':exclamation: There was an error reporting the proposal result',
                  footerMessage: `Proposal ${proposalDescription}`,
                  authorUrl: message.author.displayAvatarURL()
                })
              )
            }
            setTimeout(async () => {
              const transactionHash = await executeVotingResult(
                dao,
                report?.payload
              )
              if (transactionHash) {
                message.channel.send(
                  '@everyone',
                  embedMessage.info({
                    title: 'Proposal executed',
                    description: `The proposal has been executed in Ethereum transaction: [${transactionHash}](https://${etherscanUrl[ENVIRONMENT]}/tx/${transactionHash})`,
                    footerMessage: `Proposal ${proposalDescription}`,
                    authorUrl: message.author.displayAvatarURL()
                  })
                )
              } else {
                message.channel.send(
                  '@everyone',
                  embedMessage.error({
                    title: `@everyone There was an error executing the proposal`,
                    footerMessage: `Proposal ${proposalDescription}`,
                    authorUrl: message.author.displayAvatarURL()
                  })
                )
              }
            }, 60000)
          },
          () => {}
        )
      },
      () => {}
    )
  }
}
