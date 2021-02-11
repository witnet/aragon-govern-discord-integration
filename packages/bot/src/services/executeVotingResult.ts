import { Web3Client } from './web3Client'

const web3 = new Web3Client()

export async function executeVotingResult (dao: any, payload: any) {
  return web3.execute(dao, payload)
}
