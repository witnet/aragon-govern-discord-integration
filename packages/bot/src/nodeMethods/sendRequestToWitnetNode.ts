import { WITNET_NODE_HOST, WITNET_NODE_PORT } from '../config'
import { WitnetNodeClient } from './WitnetNodeClient'

export function sendRequestToWitnetNode () {
  return (request: {}, callbackOk: (drTxHash: string) => void) => {
    const client = new WitnetNodeClient()
    client.connect(WITNET_NODE_PORT, WITNET_NODE_HOST, async () => {
      console.log('[BOT]: Connected')
      const result = await client.sendRequest(request)
      callbackOk(result)
    })
  }
}

export default sendRequestToWitnetNode
