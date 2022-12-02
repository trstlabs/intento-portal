import { TrustlessChainClient } from 'trustlessjs'
import {
  createExecuteMessage,
  createIncreaseAllowanceMessage,
  validateTransactionSuccess,
} from 'util/messages'

type ExecuteRemoveLiquidityArgs = {
  tokenAmount: number
  senderAddress: string
  swapAddress: string
  lpTokenAddress: string
  client: TrustlessChainClient
}

export const executeRemoveLiquidity = async ({
  tokenAmount,
  swapAddress,
  senderAddress,
  lpTokenAddress,
  client,
}: ExecuteRemoveLiquidityArgs) => {
  const increaseAllowanceMessage = createIncreaseAllowanceMessage({
    tokenAmount,
    senderAddress,
    tokenAddress: lpTokenAddress,
    swapAddress,
  })

  const executeMessage = createExecuteMessage({
    senderAddress,
    contractAddress: swapAddress,
    message: {
      remove_liquidity: {
        amount: `${tokenAmount}`,
        min_token1: `${0}`,
        min_token2: `${0}`,
      },
    },
  })

  return validateTransactionSuccess(
    await client.signAndBroadcast(
      senderAddress,
      [increaseAllowanceMessage, executeMessage],
      'auto'
    )
  )
}
