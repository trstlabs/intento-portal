import { ibc } from 'intentojs'
import { cosmos } from 'intentojs'
import { SigningStargateClient, StdFee } from '@cosmjs/stargate'
import { validateTransactionSuccess } from '../../util/validateTx'

type ExecuteSendDirectArgs = {
  denom: string
  senderAddress: string
  recipientInfos: RecipientInfo[]
  client: SigningStargateClient
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
      const transferMsg =
        ibc.applications.transfer.v1.MessageComposer.withTypeUrl.transfer({
          sourcePort: 'transfer',
          sourceChannel: recipientInfos[0].channelID,
          sender: senderAddress,
          timeoutTimestamp: BigInt(
            Math.floor(new Date().getTime() / 1000) + 600
          ),
          receiver: recipientInfos[0].recipient,
          token: { denom, amount: recipientInfos[0].amount.toString() },
          timeoutHeight: undefined,
        })

      return validateTransactionSuccess(
        await client.signAndBroadcast(
          senderAddress,
          [transferMsg],
          'auto',
          recipientInfos[0].memo
        )
      )
    }
    return validateTransactionSuccess(
      await client.sendTokens(
        senderAddress,
        recipientInfos[0].recipient,
        [{ denom, amount: recipientInfos[0].amount.toString() }],
        { gas: '50000', amount: [] } as StdFee,
        recipientInfos[0].memo
      )
    )
  }

  //if multiple direct
  const msgs = []
  recipientInfos.forEach((recipient) => {
    if (recipient.channelID) {
      const transferMsg =
        ibc.applications.transfer.v1.MessageComposer.withTypeUrl.transfer({
        sourcePort: 'transfer',
        sourceChannel: recipient.channelID,
        sender: senderAddress,
        timeoutTimestamp: BigInt(Math.floor(new Date().getTime() + 60*1000)),
        timeoutHeight: undefined,
        receiver: recipient.recipient,
        token: { denom, amount: recipient.amount.toString() },
      })
      msgs.push(transferMsg)
      //return await client.tx.ibc.transfer(
    } else {
      const sendMsg = cosmos.bank.v1beta1.MessageComposer.withTypeUrl.send({
        fromAddress: senderAddress,
        toAddress: recipient.recipient,
        amount: [{ denom, amount: recipient.amount.toString() }],
      })
      msgs.push(sendMsg)
    }
  })
  return validateTransactionSuccess(await client.signAndBroadcast(senderAddress, msgs, 'auto'))
}



export class RecipientInfo {
  recipient: string
  amount: string | number
  channelID?: string
  memo: string
}

export class RecipientInfoDirect {
  recipient: string
  amount: string | number
  channelID?: string
  memo: string
}
