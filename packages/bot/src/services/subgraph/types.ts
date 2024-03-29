type Address = string

type Timestamp = string

type Bytes = string

type CollateralData = {
  token: string
  amount: string
}

type Config = {
  executionDelay: string
  scheduleDeposit: CollateralData
  challengeDeposit: CollateralData
  resolver: string
  rules: string
  maxCalldataSize: string
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

type Container = {
  id: string
  state: string
  payload: Payload
}

type Queue = {
  address: Address
  config: Config
  containers: Container[]
  nonce: string
}

type Executor = {
  address: Address
}

export type DaoEntry = {
  name: string
  queue: Queue
  executor: Executor
}
