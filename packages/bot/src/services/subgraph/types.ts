type Address = string

type CollateralData = {
  id: string
  token: string
  amount: string
}

type ConfigData = {
  id: string
  executionDelay: string
  scheduleDeposit: CollateralData
  challengeDeposit: CollateralData
  resolver: string
  rules: string
}

type Queue = {
    address: Address
    config: ConfigData
}

type Executor = {
    address: Address
}

export type RegistryEntry = {
  name: string
  queue: Queue
  executor: Executor
}