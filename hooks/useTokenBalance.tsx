import { TrustlessChainClient } from 'trustlessjs'
import { useMemo } from 'react'
import { useQuery } from 'react-query'
import { useRecoilValue } from 'recoil'
import { convertMicroDenomToDenom } from 'util/conversion'

import { CW20 } from '../services/cw20'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { DEFAULT_REFETCH_INTERVAL } from '../util/constants'
import { useIBCAssetInfo } from './useIBCAssetInfo'
import { IBCAssetInfo, /* useIBCAssetList */ } from './useIBCAssetList'
import { getBalanceForAcc, getTokenInfoFromTokenList, useTokenInfo } from './useTokenInfo'
import { useTokenList } from './useTokenList'

import { useTrustlessChainClient } from './useTrustlessChainClient'

async function fetchTokenBalance({
  client,
  token: { denom, native, token_address, decimals },
  address,
}: {
  client: TrustlessChainClient
  token: {
    denom?: string
    token_address?: string
    native?: boolean
    decimals?: number
  }
  address: string
}) {
  if (!denom && !token_address) {
    throw new Error(
      `No denom or token_address were provided to fetch the balance.`
    )
  }

  /*
   * if this is a native asset or an ibc asset that has trst_denom
   *  */
  if (native) {
    const resp = await client.query.bank.balance({ address, denom })
    const amount = resp ? Number(resp.balance.amount) : 0
    return convertMicroDenomToDenom(amount, decimals)
  }

  /*
   * everything else
   *  */
  if (token_address) {
    const balance = await CW20(client).use(token_address).balance(address, localStorage.getItem("vk" + address))

    return convertMicroDenomToDenom(Number(balance), decimals)
  }

  return 0
}

const mapIbcTokenToNative = (ibcToken?: IBCAssetInfo) => {
  if (ibcToken?.trst_denom) {
    return {
      ...ibcToken,
      native: true,
      denom: ibcToken.trst_denom,
    }
  }
  return undefined
}

export const useTokenBalance = (tokenSymbol: string) => {
  const { address, status, client } = useRecoilValue(walletState)

  const tokenInfo = useTokenInfo(tokenSymbol)
  const ibcAssetInfo = useIBCAssetInfo(tokenSymbol)

  const { data: balance = 0, isLoading } = useQuery(
    ['tokenBalance', tokenSymbol, address],
    async ({ queryKey: [, symbol] }) => {
      if (symbol && client && (tokenInfo || ibcAssetInfo)) {
        return await fetchTokenBalance({
          client,
          address,
          token: tokenInfo || ibcAssetInfo,
        })
      }
    },
    {
      enabled: Boolean(tokenSymbol && status === WalletStatusType.connected && client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return { balance, isLoading }
}

export const useMultipleTokenBalance = (tokenSymbols?: Array<string>) => {
  const { address, status, client } = useRecoilValue(walletState)
  const [tokenList] = useTokenList()
  // const [ibcAssetsList] = useIBCAssetList()

  const queryKey = useMemo(
    () => `multipleTokenBalances/${tokenSymbols?.join('+')}`,
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
              getTokenInfoFromTokenList(tokenSymbol, tokenList.tokens) ||
              mapIbcTokenToNative(
                useIBCAssetInfo(tokenSymbol)
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
        tokenList?.tokens
      ),

      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,

      onError(error) {
        console.error('Cannot fetch token balance bc:', error)
      },
    }
  )

  return [data, isLoading] as const
}


export const useGetBalanceForAcc = (address: string) => {
  const client = useTrustlessChainClient()

  const { data, isLoading } = useQuery(
    ['address', address],
    async () => {

      const resp = await getBalanceForAcc({ address, client })
      return convertMicroDenomToDenom(resp.balances[0].amount, 6)

    },
    {
      enabled: Boolean(client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  )

  return [data, isLoading] as const


}