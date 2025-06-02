import { SigningStargateClient } from '@cosmjs/stargate'
import { useQuery } from 'react-query'
import { useRecoilValue } from 'recoil'
import { convertMicroDenomToDenom } from 'util/conversion'

import { WalletStatusType, ibcWalletState } from '../state/atoms/walletAtoms'
import { useIBCAssetInfoByChainID } from './useIBCAssetInfo'


export const useIBCTokenBalance = () => {
  const { status, address, chainId } = useRecoilValue(ibcWalletState)
  const ibcAsset = useIBCAssetInfoByChainID(chainId)

  const { data: balance = 0, isLoading } = useQuery(
    `ibcTokenBalance/${chainId}/${address}`,
    async () => {
      if (!address) {
        // Return default value if symbol or address is not available
        return 0
      }

      const { denom, decimals } = ibcAsset
      const chainClient = await SigningStargateClient.connect(ibcAsset.rpc)
      const coin = await chainClient.getBalance(address, denom)

      const amount = coin ? Number(coin.amount) : 0
      return convertMicroDenomToDenom(amount, decimals)
    },
    {
      enabled: Boolean(status === WalletStatusType.connected && address && chainId && ibcAsset && ibcAsset.denom && ibcAsset.rpc), // Ensures query is only enabled when all conditions are met
      refetchOnMount: 'always', // Refetch when the component mounts
      refetchInterval: 30000,    // Refetch every 30 seconds
      staleTime: 30000,          // Cache expires after 30 seconds
      cacheTime: 300000,         // Cache data for 5 minutes
    }
  )


  return { balance, isLoading }
}
