import { WitnetNodeClient } from './WitnetNodeClient'

export function waitForTally (witnetNodeClient: WitnetNodeClient) {
  return (drTxHash: string, callbackFound: (tally: any) => void) => {
    const retryTimeout = 10000 // milliseconds

    let result
    const interval = setInterval(async () => {
      result = await witnetNodeClient.dataRequestReport(drTxHash)
      if (result?.tally) {
        let tally = result.tally
        let tallyBytes = JSON.stringify(tally.tally)
        console.log('Found tally for DR ' + drTxHash + ': ' + tallyBytes)
        callbackFound(tally)

        clearInterval(interval)
      }
    }, retryTimeout)
  }
}

export default waitForTally
