import * as net from 'net'

export function sendRequestToWitnetNode (
  request: String,
  callbackOk: (drTxHash: String) => void,
  callbackDone: () => void
) {
  let client = new net.Socket()
  const witnetNodeIp = '127.0.0.1'
  const witnetJsonRpcPort = 1234
  client.connect(witnetJsonRpcPort, witnetNodeIp, function () {
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
