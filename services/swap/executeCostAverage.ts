import {
  TrustlessChainClient,
} from 'trustlessjs'

import { TokenInfo } from '../../queries/usePoolsListQuery'
import {
  createExecuteMessage,
  validateTransactionSuccess,
} from '../../util/messages'
import { convertDenomToMicroDenom } from 'util/conversion'


type ExecuteCostAverageArgs = {
  swapDirection: 'tokenAtoTokenB' | 'tokenBtoTokenA'
  tokenAmount: number
  price: number
  slippage: number
  senderAddress: string
  swapAddress: string
  tokenA: TokenInfo
  autoExecData: AutoExecData
  client: TrustlessChainClient
}

export const executeCostAverage = async ({
  tokenA,
  swapDirection,
  swapAddress,
  slippage,
  price,
  tokenAmount,
  autoExecData,
  senderAddress,
  client,
}: ExecuteCostAverageArgs): Promise<any> => {
  const minToken = Math.floor(price * (1 - slippage))

  //if token
  if (!tokenA.native) {

    let totalRecurrenceAmount = 0

    let random = crypto.randomUUID();

    let allowanceForProxyContract = autoExecData.recurrences * totalRecurrenceAmount;
    let msg = {
      owner: senderAddress,
      input_token: swapDirection === 'tokenAtoTokenB' ? '0' : '1',
      input_token_amount: `${tokenAmount}`,
      input_token_contract: tokenA.token_address,
      input_token_hash: process.env.NEXT_PUBLIC_TIP20_CODE_HASH,
      return_min_token: `${minToken}`,
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
        code_id: Number(process.env.NEXT_PUBLIC_RECURRINGSWAP_CODE_ID),
        code_hash: process.env.NEXT_PUBLIC_RECURRINGSWAP_CODE_HASH,
        duration: autoExecData.duration + "ms",
        interval: autoExecData.interval + "ms",
        contract_id: "CosmoCostAverage ID: " + random.toString(),
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
      contractAddress: tokenA.token_address,
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

export class AutoExecData {
  duration: number
  funds: number
  startTime?: number
  interval?: number
  recurrences?: number
}