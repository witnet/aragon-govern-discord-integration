import { Message } from 'discord.js'
import { RequestMessage } from '../types'

// parse received proposal message
export function parseProposalMessage (message: Message): RequestMessage {
  // The Message format is !proposal <year>/<month>/<day> <hour>:<minutez>:<seconds> <description> to:<address> value:<value> data:<data>
  const chunks = message.content.split(' ')
  const channelId = message.channel.id
  const guildId = message.guild?.id
  const messageId = message.id

  if (chunks.length < 4) {
    // When no description or actions are provided
    return {
      channelId,
      guildId,
      messageId,
      proposalDeadlineTimestamp: 0,
      proposalDeadlineDate: '',
      proposalDescription: '',
      proposalAction: {
        to: '',
        value: '0',
        data: '0x00'
      }
    }
  } else {
    const toRegex = /\bto:\w+/
    const valueRegex = /\bvalue:\w+/
    const dataRegex = /\bdata:\w+/
    const proposalAction = {
      // get action address from message
      to: message.content.match(toRegex)?.[0].split(':')[1] || '',
      // get action value from message
      value: message.content.match(valueRegex)?.[0].split(':')[1] || '0',
      // get action data from message
      data: message.content.match(dataRegex)?.[0].split(':')[1] || '0x00'
    }
    const proposalDescription = chunks
      .slice(3, chunks.length === 7 ? -3 : -2)
      .join(' ')
    const date = chunks[1].split('/')
    const year = date[0] || 0
    const month = date[1] || 0
    const day = date[2] || 0
    const time = chunks[2]?.split(':')
    const hour = time[0] || 0
    const minutes = time[1] || 0
    const seconds = time[2] || 0
    const proposalDeadlineDate = `${year}/${month}/${day} ${hour}:${minutes}:${seconds} UTC`
    const proposalDeadlineTimestamp = Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minutes),
      Number(seconds)
    )
    return {
      channelId,
      guildId,
      messageId,
      proposalDeadlineTimestamp,
      proposalDeadlineDate,
      proposalDescription,
      proposalAction
    }
  }
}

export default parseProposalMessage
