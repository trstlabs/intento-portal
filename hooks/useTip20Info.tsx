import { TrustlessChainClient } from 'trustlessjs'
import { useMemo } from 'react'
import { useQuery } from 'react-query'
import { useRecoilValue } from 'recoil'


import { CW20 } from '../services/cw20'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL } from '../util/constants'
import { getIBCAssetInfoFromList, useIBCAssetInfo } from './useIBCAssetInfo'
import { IBCAssetInfo, useIBCAssetList } from './useIBCAssetList'
import { getTokenInfoFromTokenList, useTokenInfo } from './useTokenInfo'
import { useTokenList } from './useTokenList'

export const useContractBalance = (contractAddress: string) => {
  const { address, status, client } = useRecoilValue(walletState)


  const { data: balance = 0, isLoading } = useQuery(
    ['contractBalance', contractAddress, address],
    async () => {

      let key = localStorage.getItem("vk" + address)
      if (client == null || key == null) {
        return 0
      }
      return Number(await CW20(client).use(contractAddress).balance(address, key))
    },
    {
      enabled: Boolean(contractAddress && status === WalletStatusType.connected),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return { balance, isLoading }
}

export const useTip20Info = (contractAddress: string) => {
  const { address, status, client } = useRecoilValue(walletState)


  const { data: tip20Info, isLoading } = useQuery(
    ['cwInfo', contractAddress, address],
    async () => {


      if (client == null) {
        return undefined
      }
      return await CW20(client).use(contractAddress).tokenInfo()
    },
    {
      enabled: Boolean(contractAddress && status === WalletStatusType.connected),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return { tip20Info, isTip20Loading: isLoading }
}