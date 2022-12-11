import { protectAgainstNaN } from '../util/conversion'
import { queryTokenBalance } from '../services/liquidity'

export async function queryMyLiquidity({ swap, address, context: { client } }) {
  const providedLiquidityInMicroDenom = address
    ? await queryTokenBalance({
        tokenAddress: swap.lp_token_address,
        client,
        address,
      })
    : 0

  /* provide dollar value for reserves as well */
  const totalReserve: [number, number] = [
    protectAgainstNaN(swap.token1_reserve),
    
    (swap.token2_reserve),
  ]

  const providedReserve: [number, number] = [
    protectAgainstNaN(
      totalReserve[0] * (providedLiquidityInMicroDenom / swap.lp_token_supply)
    ),
    protectAgainstNaN(
      totalReserve[1] * (providedLiquidityInMicroDenom / swap.lp_token_supply)
    ),
  ]

  return {
    totalReserve,
    providedReserve,
    providedLiquidityInMicroDenom,
  }
}
