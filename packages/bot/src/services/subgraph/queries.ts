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
      queued(skip:$skip, first:$first) {
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
  query RegistryEntry($skip: Int, $first: Int) {
    registryEntries {
      ...RegistryEntryBase
    }
  }
  ${RegistryEntryBase}
`

export const QUERY_DAO = gql`
  query RegistryEntry($name: String!, $skip: Int, $first: Int) {
    registryEntries(where: { name: $name }, first: 1) {
        ...RegistryEntryBase
    }
  }
  ${RegistryEntryBase}
`
