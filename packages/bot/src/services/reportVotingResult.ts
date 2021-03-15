import { Web3Client } from './web3Client'
import { RegistryEntry } from './subgraph/types'
import { ProposalAction } from 'src/types'

const web3 = new Web3Client()

export async function reportVotingResult (
  dao: RegistryEntry,
  drTxHash: any,
  deadline: any,
  action: ProposalAction
) {
  // Report data request hash to `GovernQueue` contract through its `schedule` method
  const isListening = await web3.isListening()

  if (dao && isListening) {
    return await web3.schedule(
      dao,
      deadline,
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      `0x${drTxHash}`,
      action
    )
  } else {
    return null
  }
}
