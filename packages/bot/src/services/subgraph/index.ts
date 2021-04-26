import { GraphQLClient } from 'graphql-request'
import { injectable } from 'inversify'
import { subgraphEndpoint } from '../../constants'
import { ErrorUnexpectedResult } from './errors'
import { DaoEntry } from './types'
import { QUERY_DAO } from './queries'

const ENDPOINT = subgraphEndpoint

@injectable()
export class SubgraphClient {
  private client: GraphQLClient

  constructor () {
    this.client = new GraphQLClient(ENDPOINT, { headers: {} })
  }

  private async fetchResult<R> (
    queryAndParams: any,
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

  async queryDaoByName (name: string): Promise<DaoEntry | null> {
    console.log('Querying dao by name: ', name)
    const result = await this.fetchResult<{ daos: DaoEntry[] }>(
      [QUERY_DAO, { name }],
      `Unexpected result when queryin DAO by name ${name}.`
    )
    return result.daos && result.daos.length > 0 ? result.daos[0] : null
  }
}
