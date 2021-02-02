import { gql } from 'graphql-request'

const RegistryEntryBase = gql`
  fragment RegistryEntryBase on RegistryEntry {
    name
    queue {
      address
      config {
        executionDelay
        scheduleDeposit {
          token
          amount
        }
        challengeDeposit {
          token
          amount
        }
        resolver
        rules
      }
    }
    executor {
      address
    }
  }
`

export const QUERY_DAOS = gql`
  query RegistryEntry {
    registryEntries {
      ...RegistryEntryBase
    }
  }
  ${RegistryEntryBase}
`
