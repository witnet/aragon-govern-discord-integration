import * as net from 'net'
import { WITNET_NODE_HOST, WITNET_NODE_PORT } from '../config'

export function sendRequestToWitnetNode (
  request: string,
  callbackOk: (drTxHash: string) => void,
  callbackDone: () => void
) {
  let client = new net.Socket()
  client.connect(WITNET_NODE_PORT, WITNET_NODE_HOST, function () {
    console.log('Connected')
    client.write(request)
    client.write('\n')
  })
  client.on('data', function (data: any) {
    console.log('Received: ' + data)
    let response = JSON.parse(data)
    callbackOk(response.result)
    client.destroy() // kill client after server's response
  })

  client.on('close', function () {
    console.log('Connection closed')
    callbackDone()
  })
}

export default sendRequestToWitnetNode
