import { Message } from 'discord.js'
import { ENVIRONMENT, DEFAULT_EXEC_TIME } from '../config'
import { reportVotingResult } from './reportVotingResult'
import { executeVotingResult } from './executeVotingResult'
import { createDataRequest } from './createDataRequest'
import { sendRequestToWitnetNode } from '../nodeMethods/sendRequestToWitnetNode'
import { waitForTally } from '../nodeMethods/waitForTally'
import { Payload, DaoEntry } from './subgraph/types'
import {
  EtherscanUrl,
  ProposalAction,
  ReportAndExecuteCallback,
  Url
} from '../types'
import { EmbedMessage } from './embedMessage'
import { countReactions } from './countReactions'
import { decodeTallyResult } from '../utils/decodeTally'
import { longSetTimeout } from '../utils/longSetTimeout'
import { formatDistance } from 'date-fns'

import {
  defaultPositiveReactions,
  defaultNegativeReactions
} from '../constants'
import { ExecuteError, ScheduleError } from '../error'
import { ProposalRepository } from 'src/database'

const etherscanUrl: Url = {
  development: EtherscanUrl.development,
  production: EtherscanUrl.production
}

export function scheduleDataRequest (embedMessage: EmbedMessage) {
  return async (
    {
      channelId,
      messageId,
      message,
      dao,
      proposalDescription,
      proposalAction
    }: {
      channelId: string
      messageId: string
      message: Message
      dao: DaoEntry
      proposalDescription: string
      proposalAction: ProposalAction
    },
    callback: ReportAndExecuteCallback
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
              message.channel.send(
                '@everyone',
                embedMessage.error({
                  title: `:exclamation: There was an error executing the Witnet data request`,
                  description: `You can check the Witnet transaction in the [block explorer](https://witnet.network/search/${drTxHash}).`,
                  footerMessage: `Proposal ${proposalDescription}`,
                  authorUrl: message.author.displayAvatarURL()
                })
              )
              return callback(
                new Error(
                  'There was an error executing the witnet data request'
                ),
                null,
                drTxHash
              )
            }
            if (decodedTally.positive > decodedTally.negative) {
              reportAndExecute(embedMessage)(
                {
                  dao,
                  drTxHash,
                  proposalAction,
                  message,
                  proposalDescription,
                  gasPrice: undefined,
                  messageId
                },
                callback
              )
            } else {
              return callback(
                null,
                await message.channel.send(
                  '@everyone',
                  embedMessage.info({
                    title: `The proposal did not receive a majority of positive votes`,
                    description: `The action will not be executed. The result of this voting was retrieved securely using the Witnet decentralized oracle, and can be verified on the [Witnet block explorer](https://witnet.network/search/${drTxHash}).`,
                    footerMessage: `Proposal ${proposalDescription}`,
                    authorUrl: message.author.displayAvatarURL()
                  })
                ),
                drTxHash
              )
            }
          },
          () => {}
        )
      },
      () => {}
    )
  }
}

export function handleScheduleDataRequestResult (
  proposalRepository: ProposalRepository
) {
  return (
    error: ExecuteError | ScheduleError | null,
    messageId: string,
    drTxHash?: string
  ) => {
    if (drTxHash) {
      proposalRepository.setDrTxHash(messageId, drTxHash)
    }

    if (error) {
      if (error instanceof ScheduleError) {
        proposalRepository.addScheduleError(messageId)
      } else if (error instanceof ExecuteError) {
        proposalRepository.addExecuteError(messageId)
      }
    } else {
      proposalRepository.removeExecuteError(messageId)
      proposalRepository.removeScheduleError(messageId)
    }
  }
}

export function reportAndExecute (embedMessage: EmbedMessage) {
  return async (
    {
      dao,
      drTxHash,
      proposalAction,
      message,
      proposalDescription,
      gasPrice,
      messageId
    }: {
      dao: DaoEntry
      drTxHash: string
      proposalAction: ProposalAction
      message: Message
      proposalDescription: string
      gasPrice: string | undefined
      messageId: string
    },
    callback: ReportAndExecuteCallback
  ) => {
    const executionDelay = Number(dao.queue.config.executionDelay)
    const disputingTime = formatDistance(0, executionDelay * 1000, {
      includeSeconds: true
    })
    const report = await reportVotingResult(
      dao,
      drTxHash,
      `${Math.round(Date.now() / 1000 + executionDelay + DEFAULT_EXEC_TIME)}`,
      proposalAction,
      gasPrice
    )

    if (report?.payload && report?.transactionHash) {
      message.channel.send(
        '@everyone',
        embedMessage.info({
          title: 'The proposal passed with a majority of votes',
          description: `The proposed action has been scheduled in the ***${dao.name}*** Aragon Govern DAO (check the transaction on [Etherscan](https://${etherscanUrl[ENVIRONMENT]}/tx/${report?.transactionHash})). Unless disputed, the action will be executed in ${disputingTime}. The result of this voting was retrieved securely using the Witnet decentralized oracle, and can be verified on the [Witnet block explorer](https://witnet.network/search/${drTxHash}).`,
          footerMessage: `Proposal ${proposalDescription}`,
          authorUrl: message.author.displayAvatarURL()
        })
      )

      longSetTimeout(async () => {
        if (report) {
          executeVotingResultAndHandleResponse(embedMessage)(
            { dao, report, proposalDescription, message, messageId },
            callback
          )
        }
      }, (executionDelay + DEFAULT_EXEC_TIME) * 1000)

      return report
    } else {
      const isTransactionHash = report?.transactionHash
      const etherscanMsg = `Check the failed transaction on [Etherscan](https://${etherscanUrl[ENVIRONMENT]}/tx/${report?.transactionHash}). `
      message.channel.send(
        '@everyone',
        embedMessage.error({
          title: `:exclamation: There was an error reporting the result to the Aragon Govern DAO ***${dao.name}***`,
          description: `${
            isTransactionHash ? etherscanMsg : ''
          }You can try to schedule it again with the following command: \`!reschedule proposal_id:${messageId}\ [optional gas_price:<nanowits>]\``,
          // [Witnet block explorer](https://witnet.network/search/${drTxHash})
          footerMessage: `Proposal ${proposalDescription}`,
          authorUrl: message.author.displayAvatarURL()
        })
      )
      return callback(
        new ScheduleError(
          `There was an error reporting the result to the Aragon Govern DAO ${dao.name}.`
        ),
        null,
        drTxHash
      )
    }
  }
}

export function executeVotingResultAndHandleResponse (
  embedMessage: EmbedMessage
) {
  return async (
    {
      dao,
      report,
      proposalDescription,
      message,
      messageId
    }: {
      dao: DaoEntry
      report: { payload: Payload; transactionHash: string }
      proposalDescription: string
      message: Message
      messageId: string
    },
    callback: ReportAndExecuteCallback
  ) => {
    const transactionHash = await executeVotingResult(dao, report?.payload)
    if (transactionHash) {
      return callback(
        null,
        await message.channel.send(
          '@everyone',
          embedMessage.info({
            title: 'The proposed action has been executed',
            description: `The proposed action has been executed on Ethereum (check the transaction on [Etherscan](https://${etherscanUrl[ENVIRONMENT]}/tx/${transactionHash})).`,
            footerMessage: `Proposal ${proposalDescription}`,
            authorUrl: message.author.displayAvatarURL()
          })
        )
      )
    } else {
      message.channel.send(
        '@everyone',
        embedMessage.error({
          title: `:exclamation: There was an error executing the proposed action in the Aragon Govern DAO ***${dao.name}***`,
          description: `You can try to execute it again with the following command: \`!reexecute proposal_id:${messageId}\``,
          footerMessage: `Proposal ${proposalDescription}`,
          authorUrl: message.author.displayAvatarURL()
        })
      )

      return callback(
        new ExecuteError(
          `There was an error executing the proposed action in the Aragon Govern DAO ${dao.name}`
        ),
        null
      )
    }
  }
}
