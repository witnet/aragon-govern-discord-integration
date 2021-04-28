import { Message } from 'discord.js'
import { RequestMessage } from '../types'
import { convertEthUnits } from '../utils/convertEthUnits'

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
    const valueRegex = /\bvalue:\w+(\.\w+)?/
    const dataRegex = /\bdata:\w+/
    const proposalAction = {
      // get action address from message
      to: message.content.match(toRegex)?.[0].split(':')[1] || '',
      // get action value from message
      value: convertEthUnits({
        value: message.content.match(valueRegex)?.[0].split(':')[1] || '0'
      }),
      // get action data from message
      data: message.content.match(dataRegex)?.[0].split(':')[1] || '0x00'
    }
    const proposalDescription = chunks
      .slice(3, message.content.match(dataRegex) ? -3 : -2)
      .join(' ')
    const date = chunks[1].split('/')
    const year = date[0] || 0
    const month = date[1] || 0
    const day = date[2] || 0
    const time = chunks[2]?.split(':')
    const hour = Number(time[0]) < 24 ? time[0] || 0 : null
    const minutes = Number(time[1]) < 60 ? time[1] || 0 : null
    const seconds = Number(time[2]) < 60 ? time[2] || 0 : null
    const proposalDeadlineDate = `${year}/${month}/${day} ${hour}:${minutes}:${seconds} UTC`
    const proposalDeadlineTimestamp =
      hour === null || minutes === null || seconds === null
        ? 0
        : Date.UTC(
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
