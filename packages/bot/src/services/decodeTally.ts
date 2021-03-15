import cbor from 'cbor'

export function decodeTallyResult(result: Array<number>) {
  console.log('Decoded tally result:', cbor.decode(Buffer.from(result)))
  return cbor.decode(Buffer.from(result))
}

export default decodeTallyResult