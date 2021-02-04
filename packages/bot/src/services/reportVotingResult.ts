import { Web3Client } from './web3Client'
import { SubgraphClient } from './subgraph/index'

const web3 = new Web3Client()
const subgraph = new SubgraphClient()

export async function reportVotingResult (drTxHash: any) {
  // Report data request hash to `GovernQueue` contract through its `schedule` method
  const dao = await subgraph.queryDaoByName('bitconnect')
  if (dao) {
    web3.schedule(
      dao,
      `${Math.round(Date.now() / 1000 + 60)}`,
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      `0x${drTxHash}`
    )
  }
}
