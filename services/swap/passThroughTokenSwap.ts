import { TrustlessChainClient } from 'trustlessjs'
import { coin } from '@cosmjs/stargate'

import { PoolEntityType, TokenInfo } from '../../queries/usePoolsListQuery'
import {
  createExecuteMessage,
  createIncreaseAllowanceMessage,
  validateTransactionSuccess,
} from '../../util/messages'

type PassThroughTokenSwapArgs = {
  tokenAmount: number
  price: number
  slippage: number
  senderAddress: string
  inputPool: PoolEntityType
  outputPool: PoolEntityType
  tokenA: TokenInfo
  client: TrustlessChainClient
}

export const passThroughTokenSwap = async ({
  tokenAmount,
  tokenA,
  outputPool,
  inputPool,
  senderAddress,
  slippage,
  price,
  client,
}: PassThroughTokenSwapArgs): Promise<any> => {
  const minOutputToken = Math.floor(price * (1 - slippage))

  const input_token =
    inputPool.pool_assets[0].symbol === tokenA.symbol ? 'Token1' : 'Token2'

  const swapMessage = {
    pass_through_swap: {
      min_token: `${minOutputToken}`,
      input_token,
      input_token_amount: `${tokenAmount}`,
      output_address: outputPool.swap_address,
    },
  }

  if (!tokenA.native) {
    const increaseAllowanceMessage = createIncreaseAllowanceMessage({
      senderAddress,
      tokenAmount,
      tokenAddress: tokenA.token_address,
      swapAddress: inputPool.swap_address,
    })

    const executeMessage = createExecuteMessage({
      senderAddress,
      contractAddress: inputPool.swap_address,
      message: swapMessage,
    })

    return validateTransactionSuccess(
      await client.signAndBroadcast(
        [increaseAllowanceMessage, executeMessage],

      )
    )
  }

  return await client.tx.compute.executeContract({
    sender: senderAddress,
    contract: inputPool.swap_address,
    codeHash: process.env.NEXT_PUBLIC_SWAPPAIR_CODE_HASH,
    msg: swapMessage,
    funds: [coin(tokenAmount, tokenA.denom)]

  }, {
    gasLimit: Number(process.env.NEXT_PUBLIC_GAS_LIMIT_MEDIUM)

  })

}
