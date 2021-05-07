import { Web3Client } from './web3Client'
import { DaoEntry } from './subgraph/types'
import { ProposalAction, ScheduleReport } from '../types'

const web3 = new Web3Client()

export async function reportVotingResult (
  dao: DaoEntry,
  drTxHash: any,
  deadline: any,
  action: ProposalAction,
  gasPrice?: string
): Promise<ScheduleReport | null> {
  // Report data request hash to `GovernQueue` contract through its `schedule` method
  const isListening = await web3.isListening()

  if (dao && isListening) {
    return await web3.schedule(
      dao,
      deadline,
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      `0x${drTxHash}`,
      action,
      gasPrice
    )
  } else {
    return null
  }
}
