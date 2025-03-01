import { DeliverTxResponse } from '@cosmjs/stargate'

export function validateTransactionSuccess(result: DeliverTxResponse) {
  if (result.code != 0) {
    console.log(result)
    throw new Error(
      `Error when broadcasting tx ${result.transactionHash}; Code: ${result.code}; Log: ${result.rawLog}`
    )
  }
  return result
}
