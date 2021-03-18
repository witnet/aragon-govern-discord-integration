import { estimatedGasPrice } from '../../src/services/estimatedGasPrice'

describe('estimatedGasPrice', () => {
  it('it retrieves the estimated gas price from endpoint', async () => {
    const result = await estimatedGasPrice()
    expect(Number(result)).toBeTruthy()
  })
})
