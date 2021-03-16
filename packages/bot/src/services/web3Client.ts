import Web3 from 'web3'

import queueAbi from '../contracts/GovernQueue.json'
import { Action, Payload, RegistryEntry } from './subgraph/types'
import { SubgraphClient } from './subgraph'

// TODO: move configuration variables to config file
const PROVIDER_URL = process.env.WEB3_PROVIDER || 'http://localhost:8544'
const GETH_ADDRESS =
  process.env.WEB3_ACCOUNT || '0xa550Cf4F03Bd2417Cf83c8a652703cdC33c016ee'
const GAS_LIMIT = 4000000

export class Web3Client {
  private client: Web3

  constructor () {
    this.client = new Web3(new Web3.providers.HttpProvider(PROVIDER_URL))
  }

  async isListening () {
    const res = await this.client.eth.net
      .isListening()
      .then(data => {
        return data
      })
      .catch(() => {
        return false
      })
    return res
  }

  async schedule (
    dao: RegistryEntry,
    executionTime: string | number,
    allowFailuresMap: string = '0x0000000000000000000000000000000000000000000000000000000000000000',
    proof: string,
    action: Action
  ): Promise<{ payload: Payload; transactionHash: string } | null> {
    const queue = await new this.client.eth.Contract(
      (<any>queueAbi).abi,
      dao.queue.address
    )
    const subgraphClient = new SubgraphClient()
    const payload = {
      nonce: await subgraphClient.queryNextNonce(dao.name),
      executionTime,
      submitter: GETH_ADDRESS,
      executor: dao.executor.address,
      actions: [action],
      allowFailuresMap,
      proof
    }
    return queue.methods
      .schedule({
        config: dao.queue.config,
        payload
      })
      .send({ from: GETH_ADDRESS, gas: GAS_LIMIT })
      .then(function (data: { payload: Payload; transactionHash: string }) {
        console.log(
          'Schedule transaction successfully sent:',
          data.transactionHash
        )
        return {
          payload,
          transactionHash: data.transactionHash
        }
      })
      .catch(function (error: any) {
        console.error(error)
        return null
      })
  }

  async execute (dao: RegistryEntry, payload: Payload) {
    const queue = new this.client.eth.Contract(
      (<any>queueAbi).abi,
      dao.queue.address
    )
    return queue.methods
      .execute({
        config: dao.queue.config,
        payload
      })
      .send({ from: GETH_ADDRESS, gas: GAS_LIMIT })
      .then(function (data: any) {
        console.log(
          'Execute transaction successfully sent:',
          data.transactionHash
        )
        return data.transactionHash
      })
      .catch(function (error: any) {
        console.error(error)
        return null
      })
  }
}
