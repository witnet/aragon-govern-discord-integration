import { GraphQLClient } from 'graphql-request'
import { ErrorUnexpectedResult } from './errors'
import { QUERY_DAO, QUERY_DAOS } from './queries'
import { RegistryEntry } from './types'

const ENDPOINT = "https://api.thegraph.com/subgraphs/name/aragon/aragon-govern-rinkeby"

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
    const result = await this.fetchResult<{ registryEntries: RegistryEntry[] }>(
      [QUERY_DAO, { name }],
      `Unexpected result when queryin DAO by name ${name}.`
    )
    return result.registryEntries && result.registryEntries.length > 0 ? result.registryEntries[0] : null
  }

}
