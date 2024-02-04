import { SigningStargateClient } from '@cosmjs/stargate'
import { useQuery } from 'react-query'
import { useRecoilValue } from 'recoil'
import { convertMicroDenomToDenom } from 'util/conversion'

import { WalletStatusType, ibcWalletState } from '../state/atoms/walletAtoms'
import { DEFAULT_REFETCH_INTERVAL } from '../util/constants'
import { useIBCAssetInfo } from './useIBCAssetInfo'

export const useIBCTokenBalance = () => {
  const { status, tokenSymbol: symbol, address } = useRecoilValue(ibcWalletState)

  const ibcAsset = useIBCAssetInfo(symbol)

  const { data: balance = 0, isLoading } = useQuery(
    `ibcTokenBalance/${symbol}/${address}`,
    async () => {
      const { denom, decimals } = ibcAsset
      const chainClient = await SigningStargateClient.connect(
        ibcAsset.rpc
      )
      const coin = await chainClient.getBalance(address, denom)

      const amount = coin ? Number(coin.amount) : 0
      return convertMicroDenomToDenom(amount, decimals)
    },
    {
      enabled: Boolean(status === WalletStatusType.connected && address && symbol && ibcAsset && ibcAsset.denom && ibcAsset.rpc),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return { balance, isLoading }
}
