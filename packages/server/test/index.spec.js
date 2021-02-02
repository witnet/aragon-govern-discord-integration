'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const src_1 = require('../src')
describe('index', () => {
  it('sanity', () => {
    expect(src_1.server(1, 1)).toBe(2)
  })
})
