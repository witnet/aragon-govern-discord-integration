import { Web3Client } from './web3Client'
import { RegistryEntry } from './subgraph/types'

const web3 = new Web3Client()

export async function reportVotingResult (drTxHash: any, dao: RegistryEntry) {
  // Report data request hash to `GovernQueue` contract through its `schedule` method
  web3.schedule(
    dao,
    `${Math.round(Date.now() / 1000 + 60)}`,
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    `0x${drTxHash}`
  )
}
