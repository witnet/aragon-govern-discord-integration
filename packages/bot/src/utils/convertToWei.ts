import Big from 'big.js'
import { UnitConversionExponents, EthUnits } from '../types'

export function convertToWei ({
  value,
  origin
}: {
  value: string
  origin: string
}) {
  const unit: UnitConversionExponents = {
    [EthUnits.eth]: 18,
    [EthUnits.gwei]: 9
  }
  return new Big(value).times(new Big(10).pow(unit[origin])).toFixed()
}

export default convertToWei
