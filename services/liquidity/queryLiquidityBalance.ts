import { TrustlessChainClient } from 'trustlessjs'
import { protectAgainstNaN } from 'junoblocks'

type QueryLiquidityBalanceArgs = {
  address: string
  tokenAddress: string
  client: TrustlessChainClient
}

export const queryLiquidityBalance = async ({
  client,
  tokenAddress,
  address,
}: QueryLiquidityBalanceArgs) => {
  try {
    const query = await client.query.compute.queryContractPrivateState(tokenAddress, {
      balance: { address },
    })

    return protectAgainstNaN(Number(query.balance))
  } catch (e) {
    console.error('Cannot get liquidity balance:', e)
  }
}
