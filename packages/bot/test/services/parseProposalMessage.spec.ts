import { parseProposalMessage } from '../../src/services/parseProposalMessage'

describe('parseProposalMessage', () => {
  it('returns the message content', () => {
    const message = {
      content: '!proposal 03 02 2021 10:30:00 message',
      id: 1325564365,
      channel: {
        id: 1234546578909867564534231
      }
    }
    const result = {
      channelId: 1234546578909867564534231,
      messageId: 1325564365,
      proposalDeadline: '03 02 2021 10:30:00',
      proposalMessage: 'message'
    }
    expect(parseProposalMessage(message)).toStrictEqual(result)
  })
})
