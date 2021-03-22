import axios from 'axios'
import { EthUnits } from '../types'
import convertEthUnits from '../utils/convertEthUnits'
import { gasPriceEndpoint } from '../constants'

export const estimatedGasPrice = (): Promise<string> => {
  const data = axios
    .get(gasPriceEndpoint)
    .then(response => {
      return convertEthUnits({
        value: `${Number(response.data.fast) / 10}`,
        input: EthUnits.gwei
      })
    })
    .catch(err => {
      console.log(err)
      return err
    })
  return data
}
export default estimatedGasPrice
