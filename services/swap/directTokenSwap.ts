import { TrustlessChainClient, } from 'trustlessjs'
import { coin } from '@cosmjs/stargate'
import {
  toBase64,
  toUtf8,
} from "@cosmjs/encoding";
import { TokenInfo } from '../../queries/usePoolsListQuery'
import {
  createExecuteMessage,
  createIncreaseAllowanceMessage,
  validateTransactionSuccess,
} from '../../util/messages'

type DirectTokenSwapArgs = {
  swapDirection: 'tokenAtoTokenB' | 'tokenBtoTokenA'
  tokenAmount: number
  price: number
  slippage: number
  senderAddress: string
  swapAddress: string
  tokenA: TokenInfo
  client: TrustlessChainClient
}

export const directTokenSwap = async ({
  tokenA,
  swapDirection,
  swapAddress,
  senderAddress,
  slippage,
  price,
  tokenAmount,
  client,
}: DirectTokenSwapArgs) => {
  const minToken = Math.floor(price * (1 - slippage))


  const swapMessage = {
    swap2: {
      input_token: swapDirection === 'tokenAtoTokenB' ? '0' : '1',
      input_token_amount: `${tokenAmount}`,
      min_token: `${minToken}`,
    },
  }

  if (!tokenA.native) {
    const tokenMessage = {
      send: {
        recipient: swapAddress,
        recipient_code_hash: process.env.NEXT_PUBLIC_SWAPPAIR_CODE_HASH,
        amount: swapMessage.swap2.input_token_amount,
        msg: toBase64(
          toUtf8(
            JSON.stringify(
              {
                swap2: {
                  input_token: swapDirection === 'tokenAtoTokenB' ? '0' : '1',
                  input_token_amount: `${tokenAmount}`,
                  min_token: `${minToken}`,
                },
              }
            )
          )
        ),
      }
    }

    const increaseAllowanceMessage = createIncreaseAllowanceMessage({
      senderAddress,
      tokenAmount,
      tokenAddress: tokenA.token_address,
      swapAddress,
    })

    const executeMessage = createExecuteMessage({
      senderAddress,
      contractAddress: tokenA.token_address,
      codeHash: process.env.NEXT_PUBLIC_TIP20_CODE_HASH,
      message: tokenMessage,
    })
    let result = await client.signAndBroadcast([executeMessage, increaseAllowanceMessage
    ], { gasLimit: Number(process.env.NEXT_PUBLIC_GAS_LIMIT_MORE) }
    )

    return validateTransactionSuccess(
      result,

    )
  }
  let result = await client.tx.compute.executeContract({
    sender: senderAddress,
    contract: swapAddress,
    codeHash: process.env.NEXT_PUBLIC_SWAPPAIR_CODE_HASH,
    msg: swapMessage,
    funds: [coin(tokenAmount, tokenA.denom)],
  }, {
    gasLimit: +process.env.NEXT_PUBLIC_GAS_LIMIT_MORE
  })
  console.log(result)
  return validateTransactionSuccess(
    result,
  )

}
