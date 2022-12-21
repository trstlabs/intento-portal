import { MsgExecuteContract, Msg } from 'trustlessjs'
import { toUtf8 } from '@cosmjs/encoding'


type CreateIncreaseAllowanceMessageArgs = {
  senderAddress: string
  tokenAmount: number
  tokenAddress: string
  swapAddress: string
}

export const createIncreaseAllowanceMessage = ({
  senderAddress,
  tokenAmount,
  tokenAddress,
  swapAddress,
}: CreateIncreaseAllowanceMessageArgs): Msg => {
  return new MsgExecuteContract({
    sender: senderAddress,
    contract: tokenAddress,
    msg: {
      increase_allowance: {
        amount: `${tokenAmount}`,
        spender: `${swapAddress}`,
      }
    },
    funds: [],
  }
  )
}