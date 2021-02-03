type Address = string

type Timestamp = string

type Bytes = string

type CollateralData = {
  id: string
  token: string
  amount: string
}

type Config = {
  id: string
  executionDelay: string
  scheduleDeposit: CollateralData
  challengeDeposit: CollateralData
  resolver: string
  rules: string
}

export type Action = {
  to: Address
  value: string
  data: string
}

export type Payload = {
  nonce: string
  executionTime: Timestamp
  submitter: Address
  actions: Action[]
  allowsFailuresMap: Bytes
  proof: Bytes
}

type Queued = {
  id: string
  state: string
  payload: Payload
}

type Queue = {
    address: Address
    config: Config
    queued: Queued[]
}

type Executor = {
    address: Address
}

export type RegistryEntry = {
  name: string
  queue: Queue
  executor: Executor
}