import { Message } from 'discord.js'

// parse received proposal message
export function parseProposalMessage (message: Message) {
  const chunks = message.content.split(' ')
  const channelId = message.channel.id
  const guildId = message.guild?.id
  const messageId = message.id
  const proposalMessage = chunks.slice(5).join(' ')
  const proposalDeadline = chunks.slice(1, 5).join(' ') || '0'
  return {
    channelId,
    guildId,
    messageId,
    proposalDeadline,
    proposalMessage
  }
}

export default parseProposalMessage
