import Big from 'big.js'
import { UnitConversionExponents, EthUnits } from '../types'

export function convertEthUnits ({
  value,
  input = EthUnits.eth,
  output = EthUnits.wei
}: {
  value: string
  input?: string
  output?: string
}) {
  const unit: UnitConversionExponents = {
    [EthUnits.eth]: {
      [EthUnits.wei]: 18
    },
    [EthUnits.gwei]: {
      [EthUnits.wei]: 9
    },
    [EthUnits.wei]: {
      [EthUnits.eth]: -18
    }
  }
  return new Big(value).times(new Big(10).pow(unit[input][output])).toFixed()
}

export default convertEthUnits
