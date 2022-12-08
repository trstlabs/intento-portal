import { Msg, MsgExecuteContract } from 'trustlessjs'
import { toUtf8 } from '@cosmjs/encoding'
import { Coin } from '@cosmjs/launchpad'
import { CodeInfo } from 'trustlessjs/dist/protobuf/compute/v1beta1/types'


type CreateExecuteMessageArgs = {
  senderAddress: string
  message: Record<string, Record<string, string>>
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
    msg: toUtf8(JSON.stringify(message)),
    funds,
  })
}
