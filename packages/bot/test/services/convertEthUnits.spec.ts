import { convertEthUnits } from '../../src/utils/convertEthUnits'

describe('convertEthToWei', () => {
  it('returns the correct wei value if the input in eth is 1 eth', async () => {
    const expected = '1000000000000000000'
    const result = convertEthUnits({ value: '1', input: 'eth' })
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input in eth is 0.01', async () => {
    const expected = '10000000000000000'
    const result = convertEthUnits({ value: '0.01', input: 'eth' })
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input in eth is 24566777777', async () => {
    const expected = '24566777777000000000000000000'
    const result = convertEthUnits({ value: '24566777777', input: 'eth' })
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input in gwei is 24566777777', async () => {
    const expected = '24566777777000000000'
    const result = convertEthUnits({ value: '24566777777', input: 'gwei' })
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input in gwei is 0.01', async () => {
    const expected = '10000000'
    const result = convertEthUnits({ value: '0.01', input: 'gwei' })
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input in gwei is 1', async () => {
    const expected = '1000000000'
    const result = convertEthUnits({ value: '1', input: 'gwei' })
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input in gwei is 1', async () => {
    const expected = '1'
    const result = convertEthUnits({
      value: '1000000000000000000',
      input: 'wei',
      output: 'eth'
    })
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input in gwei is 1', async () => {
    const expected = '0.00134546'
    const result = convertEthUnits({
      value: '1345460000000000',
      input: 'wei',
      output: 'eth'
    })
    expect(result).toBe(expected)
  })
  it('returns the correct wei value if the input is 0.01 eth', async () => {
    const expected = '10000000000000000'
    const result = convertEthUnits({
      value: '0.01',
    })
    expect(result).toBe(expected)
  })
})
