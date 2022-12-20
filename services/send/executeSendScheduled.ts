import {
  TrustlessChainClient,
} from 'trustlessjs'

import { TokenInfo } from '../../queries/usePoolsListQuery'
import {
  createExecuteMessage,
  validateTransactionSuccess,
} from '../../util/messages'
import { convertDenomToMicroDenom } from 'util/conversion'
import { RecipientInfo } from './executeSendDirect'

type ExecuteSendScheduledArgs = {
  token: TokenInfo
  senderAddress: string
  recipientInfos: RecipientInfo[]
  autoExecData: AutoExecData
  client: TrustlessChainClient
}

export const executeScheduledSend = async ({
  token,
  client,
  recipientInfos,
  autoExecData,
  senderAddress,
}: ExecuteSendScheduledArgs): Promise<any> => {


  //if token
  if (!token.native) {

    let totalRecurrenceAmount = 0
    let scheduledRecipients = [];
    recipientInfos.forEach(recipient => {

      let scheduledRecipient = new RecipientInfoForContract()
      scheduledRecipient.recipient = recipient.recipient
      scheduledRecipient.recurrence_amount = recipient.amount.toString()
      if (recipient.memo != undefined) {
        scheduledRecipient.memo = recipient.memo
      }
      scheduledRecipients.push(scheduledRecipient)
      totalRecurrenceAmount = totalRecurrenceAmount + Number(recipient.amount);
      if (recipient.channel_id == undefined) {
        recipient.channel_id = ''
      }
    });

    let random = crypto.randomUUID();

    let allowanceForProxyContract = autoExecData.recurrences * totalRecurrenceAmount;
    let msg = {
      owner: senderAddress,
      recipient_info: scheduledRecipients,
      token_code_hash: process.env.NEXT_PUBLIC_TIP20_CODE_HASH,
      timeout: '60',
      keyring: {
        contract: process.env.NEXT_PUBLIC_KEYRING_ADDR,
        code_hash: process.env.NEXT_PUBLIC_KEYRING_CODE_HASH,
      }
    };
    console.log(msg);
    let start_duration_at = 0

    if (autoExecData.startTime != 0) {
      start_duration_at = (Math.floor(Date.now() / 1000) + autoExecData.startTime);
    }
    console.log(start_duration_at)
    let transferMessage = {
      instantiate_with_allowance: {
        max_allowance: allowanceForProxyContract.toString(),
        code_id: Number(process.env.NEXT_PUBLIC_RECURRINGSEND_CODE_ID),
        code_hash: process.env.NEXT_PUBLIC_RECURRINGSEND_CODE_HASH,
        duration: autoExecData.duration + "ms",
        interval: autoExecData.interval + "ms",
        contract_id: "CosmoRecurringSend ID: " + random.toString(),
        auto_msg: btoa(JSON.stringify({ auto_msg: {} })),
        msg: btoa(JSON.stringify(msg)),
        start_duration_at,
      }
    };
    let fundAmount = convertDenomToMicroDenom(
      autoExecData.funds,
      6)
    console.log(transferMessage);
    const executeScheduledMessage = createExecuteMessage({
      message: transferMessage,
      senderAddress,
      contractAddress: token.token_address,
      /* each native token needs to be added to the funds */
      funds: [{
        denom: 'utrst', amount:
          fundAmount.toString()
      }],
    })

    return validateTransactionSuccess(
      await client.signAndBroadcast(
        [executeScheduledMessage],
        { gasLimit: Number(process.env.NEXT_PUBLIC_GAS_LIMIT_MORE) }
      )
    )
  }

  throw new Error(
    `native token sending is not integrated (yet)`
  )

}

export class RecipientInfoForContract {
  recipient: string;
  recurrence_amount: string;
  channel_id: string;
  memo: string;
}

export class AutoExecData {
  duration: number
  funds: number
  startTime?: number
  interval?: number
  recurrences?: number
}