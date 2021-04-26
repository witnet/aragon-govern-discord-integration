import { gql } from 'graphql-request'

const RegistryEntryBase = gql`
  fragment DaoEntryBase on Dao {
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
        maxCalldataSize
      }
      containers(skip: $skip, first: $first) {
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
      nonce
    }
    executor {
      address
    }
  }
`

export const QUERY_DAO = gql`
  query Dao($name: String!, $skip: Int, $first: Int) {
    daos(where: { name: $name }, first: 1) {
      ...DaoEntryBase
    }
  }
  ${RegistryEntryBase}
`
