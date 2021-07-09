import { WITNET_NODE_HOST, WITNET_NODE_PORT } from '../config'
import { WitnetNodeClient } from './WitnetNodeClient'

export function waitForTally (
  drTxHash: string,
  callbackFound: (tally: any) => void
) {
  const client = new WitnetNodeClient()
  const retryTimeout = 10000 // milliseconds

  client.connect(WITNET_NODE_PORT, WITNET_NODE_HOST, async () => {
    console.log('[BOT]: Connected')
    let result
    const interval = setInterval(async () => {
      result = await client.dataRequestReport(drTxHash)

      if (result?.tally) {
        let tally = result.tally
        let tallyBytes = JSON.stringify(tally.tally)
        console.log('Found tally for DR ' + drTxHash + ': ' + tallyBytes)
        callbackFound(tally)

        clearInterval(interval)
      }
    }, retryTimeout)
  })
}

export default waitForTally
