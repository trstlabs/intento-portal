import { useMemo } from 'react'
import { useQuery } from 'react-query'
import { useRecoilValue } from 'recoil'
import { convertMicroDenomToDenom } from 'util/conversion'
import { SigningStargateClient } from '@cosmjs/stargate'
// import { CW20 } from '../services/cw20'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { getIBCAssetInfoFromList, useIBCAssetInfo } from './useIBCAssetInfo'
import { IBCAssetInfo, useIBCAssetList } from './useChainList'

import { getBalanceForAcc } from '../services/chain-info'
import { useCosmosRpcClient } from './useRPCClient'

async function fetchTokenBalance({
  client,
  token: { denom_local, decimals },
  address,
}: {
  client: SigningStargateClient
  token: {
    decimals?: number
    denom_local?: string
  }
  address: string
}) {
  if (!denom_local) {
    throw new Error(
      `No denom provided to fetch the balance.`
    )
  }

  /*
   * if this is a native asset or an ibc asset that has denom_local
   *  */

  const resp = await client.getBalance(address, denom_local)
  const amount = resp ? Number(resp.amount) : 0
  return convertMicroDenomToDenom(amount, decimals)

  //  (denom_local) {
  //   const resp = await client.getBalance(address, denom_local)
  //   const amount = resp ? Number(resp.amount) : 0
  //   return convertMicroDenomToDenom(amount, decimals)
  // }


}

const mapIbcTokenToNative = (ibcToken?: IBCAssetInfo) => {
  if (ibcToken?.denom_local) {
    return {
      ...ibcToken,
      native: true,
      denom: ibcToken.denom_local,
    }
  }
  return undefined
}

export const useTokenBalance = (tokenSymbol: string) => {
  const { address, status, client } = useRecoilValue(walletState)
  const ibcAssetInfo = useIBCAssetInfo(tokenSymbol)

  const { data: balance = 0, isLoading } = useQuery(
    `tokenBalance/${tokenSymbol}/${address}`,
    // ['tokenBalance'],
    async ({ queryKey: [symbol] }) => {
      if (symbol && client && ibcAssetInfo) {
        return await fetchTokenBalance({
          client,
          address,
          token: ibcAssetInfo,
        })
      }
    },
    {
      enabled: Boolean(
        tokenSymbol && status === WalletStatusType.connected && client && ibcAssetInfo
      ),
      refetchOnMount: 'always', // Refetch when the component mounts
      refetchInterval: 30000,    // Refetch every 30 seconds
      staleTime: 5000,           // Cache expires after 5 seconds
      cacheTime: 300000,         // Cache data for 5 minutes
      refetchOnWindowFocus: true,
    }
  )
  return { balance, isLoading }
}

export const useMultipleTokenBalance = (tokenSymbols?: Array<string>) => {
  const { address, status, client } = useRecoilValue(walletState)

  const [ibcAssetsList] = useIBCAssetList()

  const queryKey = useMemo(
    () => `multipleTokenBalances / ${tokenSymbols?.join('+')}`,
    [tokenSymbols]
  )

  const { data, isLoading } = useQuery(
    [queryKey, address],
    async () => {
      const balances = await Promise.all(
        tokenSymbols.map((tokenSymbol) =>
          fetchTokenBalance({
            client,
            address,
            token:
              mapIbcTokenToNative(
                getIBCAssetInfoFromList(tokenSymbol, ibcAssetsList)
              ) ||
              {},
          })
        )
      )

      return tokenSymbols.map((tokenSymbol, index) => ({
        tokenSymbol,
        balance: balances[index],
      }))
    },
    {
      enabled: Boolean(
        status === WalletStatusType.connected &&
        tokenSymbols?.length &&
        ibcAssetsList
      ),

      refetchOnMount: 'always', // Refetch when the component mounts
      refetchInterval: 30000,    // Refetch every 30 seconds
      staleTime: 5000,           // Cache expires after 5 seconds
      cacheTime: 300000,         // Cache data for 5 minutes
      refetchOnWindowFocus: true,

      onError(error) {
        console.error('Cannot fetch token balance bc:', error)
      },
    }
  )

  return [data, isLoading] as const
}

export const useGetBalanceForAcc = (address: string) => {
  const client = useCosmosRpcClient()
  const enabled = !!address && !!client

  const { data, isLoading } = useQuery(
    ['address', address],
    async () => {
      const resp = await getBalanceForAcc({ address, client })
      if (resp?.[0]) {
        return convertMicroDenomToDenom(resp[0].amount, 6)
      }
      return null
    },
    { enabled }
  )

  return [data, isLoading] as const
}
