import { TrustlessChainClient } from 'trustlessjs'
import { protectAgainstNaN } from 'junoblocks'

type queryTokenBalanceArgs = {
  address: string
  tokenAddress: string
  client: TrustlessChainClient
}

export const queryTokenBalance = async ({
  client,
  tokenAddress,
  address,
}: queryTokenBalanceArgs) => {
  try {
    const query = await client.query.compute.queryContractPrivateState({
      contractAddress:tokenAddress, codeHash: process.env.NEXT_PUBLIC_TIP20_CODE_HASH, query: {
        balance: { address, key: localStorage.getItem("vk" + address) },
      },
    })

    return protectAgainstNaN(Number(query.amount))
  } catch (e) {
    console.error('Cannot get liquidity balance:', e)
  }
}
