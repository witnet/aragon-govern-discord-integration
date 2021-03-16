import Big from 'big.js'

export function convertEthToWei (value: string) {
  return new Big(value).times(new Big(10).pow(18)).toFixed()
}

export default convertEthToWei
