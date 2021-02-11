import { parseProposalMessage } from '../../src/services/parseProposalMessage'

describe('parseProposalMessage', () => {
  it('returns the message content', () => {
    const message = {
      content: '!proposal 2021 02 10 12:00:00 message',
      id: 1325564365,
      channel: {
        id: 1234546578909867564534231
      }
    }
    const result = {
      channelId: 1234546578909867564534231,
      guildId: undefined,
      messageId: 1325564365,
      proposalDeadlineDate: '2021/02/10 12:00:00 UTC',
      proposalDeadlineTimestamp: 1615377600000,
      proposalMessage: 'message'
    }
    expect(parseProposalMessage(message)).toStrictEqual(result)
  })
})
