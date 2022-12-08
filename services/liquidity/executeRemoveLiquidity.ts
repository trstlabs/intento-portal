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
      withdrawal_liquidity: {
        amount: `${tokenAmount}`,
      },
    },
  })

  return validateTransactionSuccess(
    await client.signAndBroadcast(
      [increaseAllowanceMessage, executeMessage],
    )
  )
}
