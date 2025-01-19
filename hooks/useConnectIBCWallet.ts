import { useEffect } from 'react'
import { useMutation } from 'react-query'
import { useRecoilState } from 'recoil'
import {
  ibcWalletState,
  WalletStatusType,
} from '../state/atoms/walletAtoms'

import { useIBCAssetInfo } from './useIBCAssetInfo'

import { useChain } from '@cosmos-kit/react'
import { useChainInfoByChainID } from './useChainList'
import toast from 'react-hot-toast'

/* shares very similar logic with `useConnectWallet` and is a subject to refactor */
export const useConnectIBCWallet = (
  tokenSymbol: string,
  chainId: string,
  mutationOptions?: Parameters<typeof useMutation>[2],
  fromRegistry?: boolean
) => {
  const [{ status /* tokenSymbol: storedTokenSymbol */ }, setWalletState] =
    useRecoilState(ibcWalletState)

  let assetInfo = useIBCAssetInfo(tokenSymbol /* || storedTokenSymbol */)
  if (fromRegistry) {
    assetInfo = useChainInfoByChainID(chainId)
  }

  const chainRegistryName = assetInfo ? assetInfo.registry_name : 'cosmostest'
  console.log(chainRegistryName)
  const {
    getSigningStargateClient,
    connect,
    address,
    assets,
  } = useChain(chainRegistryName)
  const mutation = useMutation(async () => {
    if (!tokenSymbol ) {
      throw new Error(
        'You must provide `tokenSymbol` before connecting to the wallet.'
      )
    }

    if (!assetInfo) {
      throw new Error(
        'Asset info for the provided `tokenSymbol` was not found. Check your internet connection.'
      )
    }
    /* set the fetching state */
    setWalletState((value) => ({
      ...value,
      tokenSymbol,
      state: WalletStatusType.connecting,
    }))

    try {
      if (address) {

        const ibcChainClient = await getSigningStargateClient()


        /* successfully update the wallet state */
        setWalletState({
          tokenSymbol,
          address,
          client: ibcChainClient,
          status: WalletStatusType.connected,
          assets,
        })
      } else {
        // Handle the case where the client could not be obtained
        throw new Error('Failed to obtain the client')
      }
    } catch (e) {
      toast.error(e)
      /* set the error state */
      setWalletState({
        tokenSymbol: null,
        address: '',
        client: null,
        status: WalletStatusType.error,
        assets: undefined,
      })

      throw e
    }
  }, mutationOptions)

  useEffect(
    function restoreWalletConnectionIfHadBeenConnectedBefore() {
      /* restore wallet connection if the state has been set with the */
      if (status === WalletStatusType.restored) {
        connect()
        mutation.mutate(null)
      }
    }, // eslint-disable-next-line
    [status]
  )

  // useEffect(() => {
  //   function reconnectWallet() {
  //     if (assetInfo && status === WalletStatusType.connected) {
  //       connectWallet(null)
  //     }
  //   }

  //   window.addEventListener('keplr_keystorechange', reconnectWallet)
  //   return () => {
  //     window.removeEventListener('keplr_keystorechange', reconnectWallet)
  //   }
  // }, [connectWallet, status, assetInfo])

  return mutation
}

