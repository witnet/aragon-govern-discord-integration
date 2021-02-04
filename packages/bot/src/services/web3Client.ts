import Web3 from "web3"

import queueAbi from '../contracts/GovernQueue.json';
import { Action, Payload, RegistryEntry } from "./subgraph/types";

// TODO: move configuration variables to config file
const PROVIDER_URL = "http://localhost:8544"
const GETH_ADDRESS = "0xa550Cf4F03Bd2417Cf83c8a652703cdC33c016ee"
const GAS_LIMIT = 7385875

export class Web3Client {

  private client: Web3

  constructor() {
    this.client = new Web3(new Web3.providers.HttpProvider(PROVIDER_URL))
  }

  async schedule(
    dao: RegistryEntry,
    executionTime: string | number,
    actions: Action[],
    allowFailuresMap: string = '0x0000000000000000000000000000000000000000000000000000000000000000',
    proof: string,
  ) {
    const queue = new this.client.eth.Contract((<any>queueAbi).abi, dao.queue.address)
    const payload = {
      nonce: dao.queue.queued.length + 1,
      executionTime,
      submitter: GETH_ADDRESS,
      executor: dao.executor.address,
      actions,
      allowFailuresMap,
      proof,
    }
    return queue.methods.schedule({
      config: dao.queue.config,
      payload,
    })
      .send({ from: GETH_ADDRESS, gas: GAS_LIMIT })
      .then(function (data: any) {
        console.log("transaction succsessfully sent:", data.transactionHash)
        return payload
      })
      .catch(function (error: any) {
        console.error(error)
        return null
      })
  }

  async execute(
    dao: RegistryEntry,
    payload: Payload,
  ) {
    const queue = new this.client.eth.Contract((<any>queueAbi).abi, dao.queue.address)
    return queue.methods.execute({
      config: dao.queue.config,
      payload,
    })
      .send({ from: GETH_ADDRESS, gas: GAS_LIMIT })
      .then(function (data: any) {
        console.log("transaction succsessfully sent:", data.transactionHash)
        return data
      })
      .catch(function (error: any) {
        console.error(error)
        return null
      })
  }

}