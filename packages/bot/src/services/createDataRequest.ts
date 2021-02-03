// call library to create a data request
export function createDataRequest (channelId: string, messageId: string) {
  // TODO: set middleware URL here:
  const baseUrl = 'http://docker.witnet.io:3000/'
  // TODO: channelId and messageId are assumed to be valid URL parameters
  const url = baseUrl + '?channelId=' + channelId + '&messageId=' + messageId

  // Use this JSON as a template
  const requestJson = `{"jsonrpc":"2.0","method":"sendRequest","id":"1","params":{"dro":{"data_request":{"time_lock":0,"retrieve":[{"kind":"HTTP-GET","url":"PLACEHOLDER_URL_1","script":[129, 24, 119]},{"kind":"HTTP-GET","url":"PLACEHOLDER_URL_2","script":[129, 24, 119]},{"kind":"HTTP-GET","url":"PLACEHOLDER_URL_3","script":[129, 24, 119]}],"aggregate":{"filters":[],"reducer":2},"tally":{"filters":[{"op":8,"args":[]}],"reducer":2}},"witness_reward":1000,"witnesses":3,"commit_and_reveal_fee":10,"min_consensus_percentage":51,"collateral":1000000000},"fee":0}}`
  const request = JSON.parse(requestJson)

  // Modify url of each script
  // TODO: make each retrieve URL configurable
  request.params.dro.data_request.retrieve[0].url = url
  request.params.dro.data_request.retrieve[1].url = url
  request.params.dro.data_request.retrieve[2].url = url

  // Convert back to JSON
  return JSON.stringify(request)
}

export default createDataRequest
