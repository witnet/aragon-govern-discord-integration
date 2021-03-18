import axios from 'axios'
import { EthUnits } from '../types'
import convertToWei from '../utils/convertToWei'
import { gasPriceEndpoint } from '../constants'

export const estimatedGasPrice = (): Promise<string> => {
  const data = axios
    .get(gasPriceEndpoint)
    .then(response => {
      return convertToWei({
        value: `${Number(response.data.fast) / 10}`,
        origin: EthUnits.gwei
      })
    })
    .catch(err => {
      console.log(err)
      return err
    })
  return data
}
export default estimatedGasPrice
