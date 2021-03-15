import { decodeTallyResult } from '../../src/services/decodeTally'

describe('decodeTally', () => {
  it('returns error', async () => {
    const tally = [ 216, 39, 129, 24, 82 ]
    const result = await decodeTallyResult(tally)
    expect(result).toBe(false)
  })
  it('return decoded tally', async () => {
    const tally = [
      162, 104, 110, 101, 103,  97,
      116, 105, 118, 101,   0, 104,
      112, 111, 115, 105, 116, 105,
      118, 101,   1
    ]
    const result = await decodeTallyResult(tally)
    expect(result).toBe(true)
  })
})