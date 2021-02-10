import createDataRequest from '../src/services/createDataRequest'

describe('bot', () => {
  describe('listen method', () => {
    it.todo('should identify new dao command')
    it.todo('should call create DAO')
    it.todo('should send the response to the discord channel')
  })

  describe('fetchReactions method', () => {
    it.todo('should gather the reactions of the given messageId and channelId')
  })

  describe('createDataRequest', () => {
    it('should return the data request JSON', () => {
      let result = createDataRequest('a', 1, 2)
      let expected =
        '{"jsonrpc":"2.0","method":"sendRequest","id":"1","params":{"dro":{"data_request":{"time_lock":0,"retrieve":[{"kind":"HTTP-GET","url":"http://docker.witnet.io:3000/?channel_id=a&message_id=1","script":[129,24,119]},{"kind":"HTTP-GET","url":"http://docker.witnet.io:3001/?channel_id=a&message_id=1","script":[129,24,119]},{"kind":"HTTP-GET","url":"http://docker.witnet.io:3002/?channel_id=a&message_id=1","script":[129,24,119]}],"aggregate":{"filters":[],"reducer":2},"tally":{"filters":[{"op":8,"args":[]}],"reducer":2}},"witness_reward":1000,"witnesses":3,"commit_and_reveal_fee":10,"min_consensus_percentage":51,"collateral":1000000000},"fee":0}}'
      expect(result).toBe(expected)
    })
  })
})
