import * as net from 'net'
import { WITNET_NODE_HOST, WITNET_NODE_PORT } from '../config'

export function waitForTally (
  drTxHash: string,
  callbackFound: (tally: any) => void,
  callbackDone: () => void
) {
  let requestObj = {
    jsonrpc: '2.0',
    id: '1',
    method: 'dataRequestReport',
    params: [drTxHash]
  }
  const request = JSON.stringify(requestObj)
  let client = new net.Socket()
  const retryTimeout = 10000 // milliseconds
  client.connect(WITNET_NODE_PORT, WITNET_NODE_HOST, function () {
    console.log('Connected')
    client.write(request)
    client.write('\n')
  })
  client.on('data', function (data: any) {
    console.log('Received: ' + data)
    let dataValue = JSON.parse(data)
    if (dataValue && dataValue.result && dataValue.result.tally) {
      let tally = dataValue.result.tally
      let tallyBytes = JSON.stringify(tally.tally)
      console.log('Found tally for DR ' + drTxHash + ': ' + tallyBytes)
      callbackFound(tally)
      client.destroy() // kill client after server's response
    } else {
      // If the data request has not been resolved yet, try again later
      setTimeout(() => {
        client.write(request)
        client.write('\n')
      }, retryTimeout)
    }
  })

  client.on('close', function () {
    console.log('Connection closed')
    callbackDone()
  })
}

export default waitForTally
