import { Message } from 'discord.js'

export function parseRetryMessage (
  message: Message
): { messageId: string | undefined; gasPrice: string | undefined } {
  const idRegex = /\bproposal_id:\w+/
  const gasPriceRegex = /\bgas_price:\w+/

  const messageId = message.content.match(idRegex)?.[0].split(':')?.[1]
  const gasPrice = message.content.match(gasPriceRegex)?.[0].split(':')?.[1]

  return {
    messageId,
    gasPrice
  }
}

export default parseRetryMessage
