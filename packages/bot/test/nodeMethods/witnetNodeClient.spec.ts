import { WitnetNodeClient } from '../../src/nodeMethods/WitnetNodeClient'

const net = require('net')

describe('witnetNodeClient', () => {
  it('should not break with large inputs', done => {
    const longString = 'c'.repeat(100000)
    const longResponse = `{"result":"${longString}"}\n`

    const port = 8080
    const host = '127.0.0.1'
    const server = net.createServer(sock => {
      sock.on('data', () => {
        sock.write(longResponse)
      })
    })

    server.listen(port, host)

    const client = new WitnetNodeClient()

    client.connect(port, host, async () => {
      const a = await client.dataRequestReport('012345')
      expect(a).toBe(longString)
      server.close()
      client.destroy()
      done()
    })
  })
})
