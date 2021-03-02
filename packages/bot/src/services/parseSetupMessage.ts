import { Message } from 'discord.js'

// parse received setup message
export function parseSetupMessage (message: Message) {
  const chunks = message.content.split(' ')
  const guildId = message.guild?.id
  const daoName = chunks[2]
  const roleAllowed = chunks[1]
  const requester = message.member
  return {
    daoName,
    guildId,
    requester,
    roleAllowed
  }
}

export default parseSetupMessage
