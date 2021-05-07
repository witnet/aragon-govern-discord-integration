import { parseRetryMessage } from '../../src/services/parseRetryMessage'
import { Message } from 'discord.js'

describe('parseRetryMessage', () => {
  it('returns the messageId', () => {
    const message = ({
      content: '!reschedule proposal_id:12345',
      id: 1325564365,
      channel: {
        id: 1234546578909867564534231
      }
    } as unknown) as Message

    const result = {
      messageId: '12345',
      gasPrice: undefined
    }
    expect(parseRetryMessage(message)).toStrictEqual(result)
  })

  it('returns the gasPrice', () => {
    const message = ({
      content: '!reschedule proposal_id:12345 gas_price:1000',
      id: 1325564365,
      channel: {
        id: 1234546578909867564534231
      }
    } as unknown) as Message

    const result = {
      messageId: '12345',
      gasPrice: '1000'
    }
    expect(parseRetryMessage(message)).toStrictEqual(result)
  })
})
