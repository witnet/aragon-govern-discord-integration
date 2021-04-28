import { parseProposalMessage } from '../../src/services/parseProposalMessage'
import { Message } from 'discord.js'

describe('parseProposalMessage', () => {
  it('returns the message content', () => {
    const message = ({
      content: '!proposal 2021/02/10 12:00:00 description to:1234 value:0.01',
      id: 1325564365,
      channel: {
        id: 1234546578909867564534231
      }
    } as unknown) as Message
    const result = {
      channelId: 1234546578909867564534231,
      guildId: undefined,
      messageId: 1325564365,
      proposalDeadlineDate: '2021/02/10 12:00:00 UTC',
      proposalDeadlineTimestamp: 1612958400000,
      proposalDescription: 'description',
      proposalAction: {
        to: '1234',
        value: '10000000000000000',
        data: '0x00'
      }
    }
    expect(parseProposalMessage(message)).toStrictEqual(result)
  })

  it('returns the message content', () => {
    const message = ({
      content:
        '!proposal 2021/02/10 12:00:00 description 1dfgfr 12 to:1234 value:1',
      id: 1325564365,
      channel: {
        id: 1234546578909867564534231
      }
    } as unknown) as Message
    const result = {
      channelId: 1234546578909867564534231,
      guildId: undefined,
      messageId: 1325564365,
      proposalDeadlineDate: '2021/02/10 12:00:00 UTC',
      proposalDeadlineTimestamp: 1612958400000,
      proposalDescription: 'description 1dfgfr 12',
      proposalAction: {
        to: '1234',
        value: '1000000000000000000',
        data: '0x00'
      }
    }
    expect(parseProposalMessage(message)).toStrictEqual(result)
  })

  it('returns 0 if the deadline is invalid', () => {
    const message = ({
      content:
        '!proposal 2021/02/10 12:60:00 description 1dfgfr 12 to:1234 value:1',
      id: 1325564365,
      channel: {
        id: 1234546578909867564534231
      }
    } as unknown) as Message
    const result = {
      channelId: 1234546578909867564534231,
      guildId: undefined,
      messageId: 1325564365,
      proposalDeadlineDate: '2021/02/10 12:null:00 UTC',
      proposalDeadlineTimestamp: 0,
      proposalDescription: 'description 1dfgfr 12',
      proposalAction: {
        to: '1234',
        value: '1000000000000000000',
        data: '0x00'
      }
    }
    expect(parseProposalMessage(message)).toStrictEqual(result)
  })
})
