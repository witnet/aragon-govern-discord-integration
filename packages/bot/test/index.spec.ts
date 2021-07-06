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
      // This test needs the following env variables
      process.env.MONITOR_NAME_0 = 'Witnet Foundation Reactions Monitor'
      process.env.MONITOR_LINK_0 =
        'https://discord.com/api/oauth2/authorize?client_id=806098500978343986&permissions=65536&scope=bot%20messages.read'
      process.env.MONITOR_RETRIEVE_URL_0 = 'http://docker.witnet.io:3000'

      process.env.MONITOR_NAME_1 = 'Aragon One Reactions Monitor'
      process.env.MONITOR_LINK_1 =
        'https://discord.com/api/oauth2/authorize?client_id=806819543460610068&permissions=65536&scope=bot%20messages.read'
      process.env.MONITOR_RETRIEVE_URL_1 = 'http://docker.witnet.io:3001'

      process.env.MONITOR_NAME_2 = 'OtherPlane Reactions Monitor'
      process.env.MONITOR_LINK_2 =
        'https://discord.com/api/oauth2/authorize?client_id=806821381844762625&permissions=65536&scope=bot%20messages.read'
      process.env.MONITOR_RETRIEVE_URL_2 = 'http://docker.witnet.io:3002'

      const expected = {
        dro: {
          collateral: 1000000000,
          commit_and_reveal_fee: 10,
          data_request: {
            aggregate: { filters: [], reducer: 2 },
            retrieve:
              '[{"kind":"HTTP-GET","url":"http://docker.witnet.io:3000?channel_id=a&message_id=1","script":[129,24,119]},{"kind":"HTTP-GET","url":"http://docker.witnet.io:3001?channel_id=a&message_id=1","script":[129,24,119]},{"kind":"HTTP-GET","url":"http://docker.witnet.io:3002?channel_id=a&message_id=1","script":[129,24,119]}]',
            tally: { filters: [{ args: [], op: 8 }], reducer: 2 },
            time_lock: 0
          },
          min_consensus_percentage: 51,
          witness_reward: 1000,
          witnesses: 100
        },
        fee: 0
      }

      const result = createDataRequest('a', '1')

      expect(result).toStrictEqual(expected)
    })
  })
})
