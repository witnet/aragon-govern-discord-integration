import { parseSetupMessage } from '../../src/services/parseSetupMessage'
import { Message } from 'discord.js'

describe('parseSetupMessage', () => {
  it('returns the message content', () => {
    const message = ({
      content: '!setup una dao muy larga con espacios @everyone',
      id: 1325564365,
      channel: {
        id: 1234546578909867564534231
      }
    } as unknown) as Message
    const result = {
      daoName: 'una dao muy larga con espacios',
      guildId: undefined,
      requester: undefined,
      roleAllowed: '@everyone'
    }
    expect(parseSetupMessage(message)).toEqual(result)
  })

  it('returns the message content', () => {
    const message = ({
      content: '!setup una dao muy larga con espacios <@&12345678901112>',
      id: 1325564365,
      channel: {
        id: 1234546578909867564534231
      }
    } as unknown) as Message
    const result = {
      daoName: 'una dao muy larga con espacios',
      guildId: undefined,
      requester: undefined,
      roleAllowed: '<@&12345678901112>'
    }
    expect(parseSetupMessage(message)).toEqual(result)
  })
})
