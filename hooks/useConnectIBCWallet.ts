import { useEffect, useRef } from 'react'
import { useMutation } from 'react-query'
import { useRecoilState } from 'recoil'
import { ibcWalletState, WalletStatusType } from '../state/atoms/walletAtoms'

import { useIBCAssetInfo } from './useIBCAssetInfo'
import { useChain } from '@cosmos-kit/react'
import { useChainInfoByChainID } from './useChainList'
import toast from 'react-hot-toast'

export const useConnectIBCWallet = (
  tokenSymbol,
  chainId,
  mutationOptions,
  fromRegistry = false
) => {
  const [{ status }, setWalletState] = useRecoilState(ibcWalletState)
  const hasConnected = useRef(false) // Prevent multiple connects

  if (!tokenSymbol || !chainId) {
    return
  }

  let assetInfo = useIBCAssetInfo(tokenSymbol)
  if (fromRegistry) {
    assetInfo = useChainInfoByChainID(chainId)
  }

  const chainRegistryName = assetInfo?.registry_name || 'cosmostest'
  const { getSigningStargateClient, connect, address, assets } =
    useChain(chainRegistryName)

  const mutation = useMutation(async () => {
    if (!tokenSymbol) {
      throw new Error('You must provide `tokenSymbol` before connecting to the wallet.')
    }

    if (!assetInfo) {
      throw new Error('Asset info for the provided `tokenSymbol` was not found.')
    }

    setWalletState((value) => ({
      ...value,
      tokenSymbol,
      status: WalletStatusType.connecting,
    }))

    try {
      await connect() // Ensure connection is established first

      if (!address) {
        throw new Error('Wallet address not available after connection.')
      }

      const ibcChainClient = await getSigningStargateClient()

      if (!ibcChainClient) {
        throw new Error('Failed to obtain the signing client.')
      }

      setWalletState({
        tokenSymbol,
        address,
        client: ibcChainClient,
        status: WalletStatusType.connected,
        assets,
      })
    } catch (error) {
      toast.error('Failed to connect IBC wallet')

      setWalletState({
        tokenSymbol: null,
        address: '',
        client: null,
        status: WalletStatusType.error,
        assets: undefined,
      })

      throw error
    }
  }, mutationOptions)

  useEffect(() => {
    if (!assetInfo || status !== WalletStatusType.restored || hasConnected.current) {
      return
    }

    let isMounted = true
    hasConnected.current = true // Prevent multiple runs

    const restoreConnection = async () => {
      try {
        await connect()
        if (isMounted && address) {
          mutation.mutate(null)
        } else {
          console.error('Address not available after reconnecting.')
        }
      } catch (error) {
        console.error('Error restoring connection:', error)
      }
    }

    restoreConnection()

    return () => {
      isMounted = false // Cleanup
    }
  }, [status, assetInfo, connect, address])

  return mutation
}
