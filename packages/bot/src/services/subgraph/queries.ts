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
      queued (first: 1000) {
        id
        state
        payload {
          nonce
          executionTime
          submitter
          actions {
            to
            value
            data
          }
          allowFailuresMap
          proof
        }
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

export const QUERY_DAO = gql`
  query RegistryEntry($name: String!) {
    registryEntries(where: { name: $name }, first: 1) {
        ...RegistryEntryBase
    }
  }
  ${RegistryEntryBase}
`
