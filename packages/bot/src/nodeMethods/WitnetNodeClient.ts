import { Socket } from 'net'

export class WitnetNodeClient {
  public client: Socket

  constructor () {
    this.client = new Socket()
  }

  destroy () {
    this.client.destroy()
  }

  private async callApiMethod (
    methodName: string,
    params: {} = {},
    callbackDone?: (param?: any) => void
  ): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      id: '1',
      method: methodName,
      params: JSON.stringify(params)
    }
    this.client.write(`${JSON.stringify(request)}`)
    this.client.write('\n')

    const result = await new Promise(resolve => {
      let content = ''
      this.client.on('data', chunk => {
        content += chunk.toString()
        if (chunk.toString().includes('\n')) {
          resolve(JSON.parse(content)?.result)
          this.destroy()
        }
      })
    })

    this.client.on('close', () => {
      if (callbackDone) {
        callbackDone(result)
      }
    })
    return result
  }

  async connect (port: number, host: string, cb: () => void) {
    this.client.connect(port, host, cb)
  }

  async sendRequest (dr: object = {}) {
    return await this.callApiMethod('sendRequest', dr)
  }

  async dataRequestReport (drTxHash: string): Promise<any> {
    return await this.callApiMethod('dataRequestReport', [drTxHash])
  }
}
