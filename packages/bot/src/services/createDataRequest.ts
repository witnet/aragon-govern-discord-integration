// Factory for the URLs to be used as the sources in the data request
function urlFactory (
  channelId: string,
  messageId: string,
  base_url: string,
  port: number = 80
) {
  return `${base_url}:${port}/?channel_id=${channelId}&message_id=${messageId}`
}

// call library to create a data request
export function createDataRequest (channelId: string, messageId: string) {
  // TODO: channelId and messageId are assumed to be valid URL parameters
  const baseUrl = 'http://docker.witnet.io'

  // Use this JSON as a template
  // Use the following Rust code to generate the script:
  // https://github.com/lrubiorod/rad-script
  /*
    pub fn dr() -> Vec<u8> {
        cbor_to_vec(&Value::Array(vec![
            Value::Integer(RadonOpCodes::StringParseJSONMap as i128),
        ]))
        .unwrap()
    }
  */
  const requestJson = `{"jsonrpc":"2.0","method":"sendRequest","id":"1","params":{"dro":{"data_request":{"time_lock":0,"retrieve":[{"kind":"HTTP-GET","url":"PLACEHOLDER_URL_1","script":[129, 24, 119]},{"kind":"HTTP-GET","url":"PLACEHOLDER_URL_2","script":[129, 24, 119]},{"kind":"HTTP-GET","url":"PLACEHOLDER_URL_3","script":[129, 24, 119]}],"aggregate":{"filters":[],"reducer":2},"tally":{"filters":[{"op":8,"args":[]}],"reducer":2}},"witness_reward":1000,"witnesses":1,"commit_and_reveal_fee":10,"min_consensus_percentage":51,"collateral":1000000000},"fee":0}}`
  const request = JSON.parse(requestJson)

  // Modify url of each script
  // TODO: make each retrieve URL configurable
  request.params.dro.data_request.retrieve[0].url = urlFactory(
    channelId,
    messageId,
    baseUrl,
    3000
  )
  request.params.dro.data_request.retrieve[1].url = urlFactory(
    channelId,
    messageId,
    baseUrl,
    3001
  )
  request.params.dro.data_request.retrieve[2].url = urlFactory(
    channelId,
    messageId,
    baseUrl,
    3002
  )

  // Convert back to JSON
  return JSON.stringify(request)
}

export default createDataRequest
