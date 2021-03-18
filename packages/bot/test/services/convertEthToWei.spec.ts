import { convertToWei } from '../../src/utils/convertToWei'

describe('convertEthToWei', () => {
  it('returns the correct wei value if the input in eth is 1 eth', async () => {
    const expected = '1000000000000000000'
    const result = convertToWei({ value: '1', origin: 'eth' })
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input in eth is 0.01', async () => {
    const expected = '10000000000000000'
    const result = convertToWei({ value: '0.01', origin: 'eth' })
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input in eth is 24566777777', async () => {
    const expected = '24566777777000000000000000000'
    const result = convertToWei({ value: '24566777777', origin: 'eth' })
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input in gwei is 24566777777', async () => {
    const expected = '24566777777000000000'
    const result = convertToWei({ value: '24566777777', origin: 'gwei' })
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input in gwei is 0.01', async () => {
    const expected = '10000000'
    const result = convertToWei({ value: '0.01', origin: 'gwei' })
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input in gwei is 1 eth', async () => {
    const expected = '1000000000'
    const result = convertToWei({ value: '1', origin: 'gwei' })
    expect(result).toBe(expected)
  })
})
