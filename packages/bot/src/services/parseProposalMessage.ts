import { Message } from 'discord.js'
import { RequestMessage } from '../types'

// parse received proposal message
export function parseProposalMessage (message: Message): RequestMessage {
  const chunks = message.content.split(' ')
  const channelId = message.channel.id
  const guildId = message.guild?.id
  const messageId = message.id
  let proposalDescription = ''
  let proposalDeadlineDate = ''
  let proposalDeadlineTimestamp = 0
  if (chunks.length < 5) {
    proposalDescription = ''
    proposalDeadlineDate = ''
    proposalDeadlineTimestamp = 0
  } else {
    proposalDescription = chunks.slice(5).join(' ')
    const year = chunks[1] || 0
    const month = chunks[2] || 0
    const day = chunks[3] || 0
    const time = chunks[4]?.split(':')
    const hour = time[0] || 0
    const minutes = time[1] || 0
    const seconds = time[2] || 0
    proposalDeadlineDate = `${year}/${month}/${day} ${hour}:${minutes}:${seconds} UTC`
    proposalDeadlineTimestamp = Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minutes),
      Number(seconds)
    )
  }
  return {
    channelId,
    guildId,
    messageId,
    proposalDeadlineTimestamp,
    proposalDeadlineDate,
    proposalDescription
  }
}

export default parseProposalMessage
