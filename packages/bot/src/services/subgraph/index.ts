import { GraphQLClient } from 'graphql-request'
import { injectable } from 'inversify'
import { ErrorUnexpectedResult } from './errors'
import { QUERY_DAO, QUERY_DAOS } from './queries'
import { RegistryEntry } from './types'

const ENDPOINT = "https://api.thegraph.com/subgraphs/name/aragon/aragon-govern-rinkeby"

@injectable()
export class SubgraphClient {
  private client: GraphQLClient

  constructor() {
    this.client = new GraphQLClient(ENDPOINT, { headers: {} })
  }

  private async fetchResult<R>(
    queryAndParams:
      | [any]
      | [
        any,
        { [key: string]: any }
      ],
    errorMessage: string
  ): Promise<R> {
    const [query, params] = queryAndParams
    try {
      const result = await this.client.request(query, params)
      return result as R
    } catch (err) {
      throw new ErrorUnexpectedResult(errorMessage)
    }
  }

  async queryDaos(): Promise<RegistryEntry[] | null> {
    const result = await this.fetchResult<{ registryEntries: RegistryEntry[] }>(
      [QUERY_DAOS],
      `Unexpected result when querying the DAOs.`
    )
    return result.registryEntries ?? []
  }

  async queryDaoByName(name: string): Promise<RegistryEntry | null> {
    await this.queryNextNonce(name)
    const result = await this.fetchResult<{ registryEntries: RegistryEntry[] }>(
      [QUERY_DAO, { name }],
      `Unexpected result when queryin DAO by name ${name}.`
      )
    return result.registryEntries && result.registryEntries.length > 0 ? result.registryEntries[0] : null
  }

  // TODO: review code 
  async queryNextNonce(name: string): Promise<number> {
    let hasMore = false
    let result: {registryEntries: Array<any> }= { registryEntries: []}
    let limit = 10
    let counter = 1
    
    while (!hasMore) {
      result = await this.fetchResult<{ registryEntries: RegistryEntry[] }>(
        [QUERY_DAO, { name, first: limit, skip: limit*(counter - 1) }],
        `Unexpected result when queryin DAO by name ${name}.`
        )
        if (result.registryEntries[0].queue.queued.length === limit) {
          counter++
        } else {
          hasMore = true
        }
        
    } 
    return (counter-1)*limit + result.registryEntries.length + 3
  }

}
