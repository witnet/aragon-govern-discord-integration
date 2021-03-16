import { convertEthToWei } from '../../src/utils/convertEthToWei'

describe('convertEthToWei', () => {
  it('returns the correct wei value if the input is 1 eth', async () => {
    const expected = '1000000000000000000'
    const result = convertEthToWei('1')
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input is 0.01', async () => {
    const expected = '10000000000000000'
    const result = convertEthToWei('0.01')
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input is 24566777777', async () => {
    const expected = '24566777777000000000000000000'
    const result = convertEthToWei('24566777777')
    expect(result).toBe(expected)
  })
})