import { SigningStargateClient } from '@cosmjs/stargate'
import { useQuery } from 'react-query'
import { useRecoilValue } from 'recoil'
import { convertMicroDenomToDenom } from 'util/conversion'

import { ibcWalletState, walletState } from '../state/atoms/walletAtoms'
import { DEFAULT_REFETCH_INTERVAL } from '../util/constants'
import { useIBCAssetInfo } from './useIBCAssetInfo'

export const useIBCTokenBalance = (tokenSymbol) => {
  const { address: nativeWalletAddress } = useRecoilValue(walletState)
  const ibcAsset = useIBCAssetInfo(tokenSymbol)
  const ibcState = useRecoilValue(ibcWalletState)
  const { denom, decimals } = ibcAsset
  const { data: balance = 0, isLoading } = useQuery(
    [`ibcTokenBalance/${denom}`, nativeWalletAddress],
    async () => {
      

      // await window.keplr.enable(chain_id)
      // const offlineSigner = await window.keplr.getOfflineSigner(chain_id)

      const chainClient = await SigningStargateClient.connect(
        ibcState.rpc
      )

     // const [{ address }] = await offlineSigner.getAccounts()
      const coin = await chainClient.getBalance(nativeWalletAddress, denom)

      const amount = coin ? Number(coin.amount) : 0
      return convertMicroDenomToDenom(amount, decimals)
    },
    {
      enabled: Boolean(nativeWalletAddress && ibcAsset && ibcState),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return { balance, isLoading}
}
