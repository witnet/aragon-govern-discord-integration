import { server } from '../src'

describe('index', () => {
  it('sanity', () => {
    expect(server(1, 1)).toBe(2)
  })
})
