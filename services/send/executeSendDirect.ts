import {
  TrustlessChainClient, Coin, MsgTransfer, MsgSend,
} from 'trustlessjs'

type ExecuteSendDirectArgs = {
  denom: string
  senderAddress: string
  recipientInfos: RecipientInfo[]
  client: TrustlessChainClient
}

export const executeDirectSend = async ({
  denom,
  client,
  recipientInfos,
  senderAddress,
}: ExecuteSendDirectArgs): Promise<any> => {

  //if one direct
  if (!recipientInfos[1]) {
    console.log(recipientInfos[0])
    if (recipientInfos[0].channelID) {
      return await client.tx.ibc.transfer({
        sourcePort: 'transfer',
        sourceChannel: recipientInfos[0].channelID,
        sender: senderAddress,
        timeoutTimestampSec: (Math.floor(new Date().getTime() / 1000) + 600).toString(),
        receiver: recipientInfos[0].recipient,
        token: { denom, amount: recipientInfos[0].amount.toString() },
      }, {
        gasLimit: 50_000,
        memo: recipientInfos[0].memo
      },)
    }
    return await client.tx.bank.send(
      {
        fromAddress: senderAddress,
        toAddress: recipientInfos[0].recipient,
        amount: [{ denom, amount: recipientInfos[0].amount.toString() }],

      },
      {
        gasLimit: 30_000,
        memo: recipientInfos[0].memo
      },
    )
  }

  //if multiple direct
  const msgs = []
  recipientInfos.forEach(recipient => {
    
    if (recipient.channelID) {

      const transferMsg = new MsgTransfer({
        sourcePort: 'transfer',
        sourceChannel: recipient.channelID,
        sender: senderAddress,
        timeoutTimestampSec: (Math.floor(new Date().getTime() / 1000) + 600).toString(),
        receiver: recipient.recipient,
        token: { denom, amount: recipient.amount.toString() },
      })
      msgs.push(transferMsg)
      //return await client.tx.ibc.transfer(

    } else {
      const sendMsg = new MsgSend({
        fromAddress: senderAddress,
        toAddress: recipient.recipient,
        amount: [{ denom, amount: recipient.amount.toString() }],
      })
      msgs.push(sendMsg)
    }
  }
  )
  return await client.signAndBroadcast(msgs)

}


/** Output models transaction outputs for MsgMultiSend. */
export class Output {
  address: string;
  coins: Coin[];
};

export class RecipientInfo {
  recipient: string;
  amount: string | number;
  channelID?: string;
  memo: string;
}

export class RecipientInfoDirect {
  recipient: string;
  amount: string | number;
  channelID?: string;
  memo: string;
}
