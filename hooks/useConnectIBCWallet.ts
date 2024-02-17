import { useEffect } from 'react'
import { useMutation } from 'react-query'
import { useRecoilState } from 'recoil'
import { ibcWalletState, WalletStatusType } from '../state/atoms/walletAtoms'

import { useIBCAssetInfo } from './useIBCAssetInfo'

import { useChain } from '@cosmos-kit/react'
import { useChainInfoByChainID } from './useChainList'

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

  const chainRegistryName = assetInfo ? assetInfo.registry_name : 'cosmoshub'
  const {
    isWalletConnected,
    getSigningStargateClient,
    connect,
    address,
    assets,
  } = useChain(chainRegistryName, true)

  const mutation = useMutation(async () => {
    if (!tokenSymbol /* && !storedTokenSymbol */) {
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
      client: null,
      state: WalletStatusType.connecting,
    }))

    try {
      if (!isWalletConnected) {
        await connect()
        await sleep(500)
      }

      const ibcChainClient = await getSigningStargateClient()

      console.log('ibcChainClient', ibcChainClient)

      /* successfully update the wallet state */
      setWalletState({
        tokenSymbol,
        address,
        client: ibcChainClient,
        status: WalletStatusType.connected,
        assets,
      })
    } catch (e) {
      // toast.error("Error connecting wallet: ",e)
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

  const connectWallet = mutation.mutate

  useEffect(() => {
    /* restore wallet connection */
    if (status === WalletStatusType.restored && assetInfo) {
      connectWallet(null)
    }
  }, [status, connectWallet, assetInfo])

  useEffect(() => {
    function reconnectWallet() {
      if (assetInfo && status === WalletStatusType.connected) {
        connectWallet(null)
      }
    }

    window.addEventListener('keplr_keystorechange', reconnectWallet)
    return () => {
      window.removeEventListener('keplr_keystorechange', reconnectWallet)
    }
  }, [connectWallet, status, assetInfo])

  return mutation
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
