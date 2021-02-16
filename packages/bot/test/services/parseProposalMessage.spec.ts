import { parseProposalMessage } from '../../src/services/parseProposalMessage'
import { Message} from 'discord.js'

describe('parseProposalMessage', () => {
  it('returns the message content', () => {
    const message = {
      content: '!proposal 2021 02 10 12:00:00 message',
      id: 1325564365,
      channel: {
        id: 1234546578909867564534231
      }
    } as unknown as Message

    const result = {
      channelId: 1234546578909867564534231,
      guildId: undefined,
      messageId: 1325564365,
      proposalDeadlineDate: '2021/02/10 12:00:00 UTC',
      proposalDeadlineTimestamp: 1612958400000,
      proposalDescription: 'message'
    }
    expect(parseProposalMessage(message)).toStrictEqual(result)
  })
})
