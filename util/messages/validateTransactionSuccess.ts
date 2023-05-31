import { Tx } from 'trustlessjs'

export function validateTransactionSuccess(result: Tx) {
  if (result.code != 0) {
    console.log(result)
    throw new Error(
      `Error when broadcasting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`
    )
  }
  return result
}
