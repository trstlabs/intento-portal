import { SigningStargateClient } from '@cosmjs/stargate'

import {
  Coin,
  MsgSend,

} from 'trustlessjs'

type ExecuteSendFundsArgs = {
  fromAddress: string
  toAddress: string
  client: SigningStargateClient
  coin: Coin
}

export const executeSendFunds = async ({
  client,
  toAddress,
  fromAddress,
  coin,
}: ExecuteSendFundsArgs): Promise<any> => {
    let sendMsg = new MsgSend({ fromAddress, toAddress, amount: [coin] })
    const MsgSendObject = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: sendMsg,
    }
    return await client.signAndBroadcast(fromAddress, [MsgSendObject], "auto");
}

