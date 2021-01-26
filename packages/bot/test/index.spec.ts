import { bot } from '../src'

describe('index', () => {
  it('sanity', () => {
    expect(bot(1, 1)).toBe(2)
  })
})
