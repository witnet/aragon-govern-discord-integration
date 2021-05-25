import { loadReactionMonitors } from './loadReactionMonitors'

// call library to create a data request
export function createDataRequest (channelId: string, messageId: string) {
  // TODO: channelId and messageId are assumed to be valid URL parameters

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
  const retrievals = loadReactionMonitors().map(reactionMonitor => ({
    kind: 'HTTP-GET',
    url: `${reactionMonitor.retrieveUrl}?channel_id=${channelId}&message_id=${messageId}`,
    script: [129, 24, 119]
  }))
  const requestJson = `{"jsonrpc":"2.0","method":"sendRequest","id":"1","params":{"dro":{"data_request":{"time_lock":0,"retrieve":${JSON.stringify(
    retrievals
  )},"aggregate":{"filters":[],"reducer":2},"tally":{"filters":[{"op":8,"args":[]}],"reducer":2}},"witness_reward":1000,"witnesses":3,"commit_and_reveal_fee":10,"min_consensus_percentage":51,"collateral":1000000000},"fee":0}}`

  return requestJson
}

export default createDataRequest
