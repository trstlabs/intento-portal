import {
  TrustlessChainClient, Coin, Msg
} from 'trustlessjs'

import { TokenInfo } from '../../queries/usePoolsListQuery'
import {
  createExecuteMessage,
  validateTransactionSuccess,
} from '../../util/messages'


type ExecuteSendDirectArgs = {
  token: TokenInfo
  senderAddress: string
  recipientInfos: RecipientInfo[]
  client: TrustlessChainClient
}

export const executeDirectSend = async ({
  token,
  client,
  recipientInfos,
  senderAddress,
}: ExecuteSendDirectArgs): Promise<any> => {

  //if token
  if (!token.native) {
    let transferMessage = {}
    let directRecipients = [];
    let ibcRecipients = [];
    let executeSendMessageArray: Msg[] = [];
    recipientInfos.forEach(recipient => {
      if (recipient.channel_id == undefined) {
        let directRecipient = new RecipientInfoDirect()
        directRecipient.recipient = recipient.recipient
        directRecipient.amount = recipient.amount
        directRecipient.memo = recipient.memo
        directRecipients.push(directRecipient)
      } else {
        ibcRecipients.push(recipient)
      }
    });

    // create message for ibc recipients (todo implement)
    let executeIbcSendMultiMessage;
    if (ibcRecipients[1]) {
      let transferIBCMessage = {
        transfer_multi_ibc: {
          recipients: `${ibcRecipients}`,
        }
      }
      executeIbcSendMultiMessage = createExecuteMessage({
        message: transferIBCMessage,
        senderAddress,
        contractAddress: token.token_address,
        /* each native token needs to be added to the funds */
        funds: [
        ],
      })
      executeSendMessageArray.push(executeIbcSendMultiMessage)
    }
    // single recipient 
    if (!recipientInfos[1]) {

      if (recipientInfos[0].channel_id == undefined) {
        transferMessage = {
          transfer: {
            recipient: recipientInfos[0].recipient,
            amount: recipientInfos[0].amount.toString(),
          }
        }
      } else {
        transferMessage = {
          ibc_transfer: {
            recipient: recipientInfos[0].recipient,
            amount: recipientInfos[0].amount.toString(),
            channel_id: recipientInfos[0].channel_id,
          }
        }
      }
    }
    const executeSendMessage = createExecuteMessage({
      message: transferMessage,
      senderAddress,
      contractAddress: token.token_address,
      /* each native token needs to be added to the funds */
      funds: [
      ],
    })
    executeSendMessageArray.push(executeSendMessage)

    return validateTransactionSuccess(
      await client.signAndBroadcast(
        executeSendMessageArray,
        { gasLimit: Number(process.env.NEXT_PUBLIC_GAS_LIMIT_MORE) }
      )
    )
  }


  //if one direct
  if (!recipientInfos[1]) {
    console.log(recipientInfos[0])
    return await client.tx.bank.send(
      {
        fromAddress: senderAddress,
        toAddress: recipientInfos[0].recipient,
        amount: [{ denom: token.denom, amount: recipientInfos[0].amount.toString() }],

      },
      {
        gasLimit: 30_000,
        memo: recipientInfos[0].memo
      },
    )
  }

  //if one direct
  if (!recipientInfos[1]) {
    console.log(recipientInfos[0])
    if (recipientInfos[0].channel_id != undefined) {
      throw new Error(
        `sending over ibc for native tokens is not enabled on Cosmoportal yet`
      )
    };
    return await client.tx.bank.send(
      {
        fromAddress: senderAddress,
        toAddress: recipientInfos[0].recipient,
        amount: [{ denom: token.denom, amount: recipientInfos[0].amount.toString() }],

      },
      {
        gasLimit: 30_000,
        memo: recipientInfos[0].memo
      },
    )
  }
  //if multiple direct
  let totalAmount = 0
  let outputRecipients = [];
  recipientInfos.forEach(recipient => {
    if (recipient.channel_id != undefined) {
      throw new Error(
        `sending over ibc for native tokens is not enabled on Cosmoportal yet`
      )
    };
    let outputRecipient = new Output()
    outputRecipient.address = recipient.recipient
    outputRecipient.coins[0].denom = token.denom
    outputRecipient.coins[0].amount = recipient.amount.toString()
    totalAmount = totalAmount + Number(recipient.amount)
    outputRecipients.push(outputRecipient)
  });

  prompt("In this transaction, the memo will be the first memo, " + recipientInfos[0].memo + ", for all recipients")
  return await client.tx.bank.multiSend(
    {
      inputs: [
        {
          address: senderAddress,
          coins: [{ denom: token.denom, amount: totalAmount.toString() }],
        },
      ],
      outputs: outputRecipients,
    },
    {
      gasLimit: 200_000,
      memo: recipientInfos[0].memo
    },
  )
}


/** Output models transaction outputs for MsgMultiSend. */
export class Output {
  address: string;
  coins: Coin[];
};

export class RecipientInfo {
  recipient: string;
  amount: string | number;
  channel_id: string;
  memo: string;
}

export class RecipientInfoDirect {
  recipient: string;
  amount: string | number;
  // channel_id: string;
  memo: string;
}
