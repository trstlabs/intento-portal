import { Msg, MsgExecuteContract } from 'trustlessjs'

import { Coin } from '@cosmjs/launchpad'



type CreateExecuteMessageArgs = {
  senderAddress: string
  message: Record<string, Record<string, any>>
  contractAddress: string
  funds?: Array<Coin>
  codeHash?: string,
}

export const createExecuteMessage = ({
  senderAddress,
  contractAddress,
  message,
  codeHash,
  funds,
}: CreateExecuteMessageArgs): Msg => {

  return new MsgExecuteContract({
    sender: senderAddress,
    contract: contractAddress,
    codeHash,
    msg: message,
    funds,
  })
}
