import { Message } from 'discord.js'

// parse received setup message
export function parseSetupMessage (message: Message) {
  const guildId = message.guild?.id
  // Create chunks from message content to get the last word despite from which caracter it starts
  const chunks = message.content.replace('  ', ' ').split(' ')
  const roleAllowed = chunks[chunks.length - 1].trim()
  // Split between the `!setup` part, the DAO name, and the allowed role
  const daoName = message.content
    .replace('  ', ' ')
    .split(/<@|@|!setup/)[1]
    .trim()

  const requester = message.member
  return {
    daoName,
    guildId,
    requester,
    roleAllowed
  }
}

export default parseSetupMessage
