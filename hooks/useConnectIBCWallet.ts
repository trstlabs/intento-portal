import { useEffect, useRef } from 'react'
import { useMutation } from 'react-query'
import { useRecoilState } from 'recoil'
import { ibcWalletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { useIBCAssetInfo } from './useIBCAssetInfo'
import { useChain } from '@cosmos-kit/react'
import { useChainInfoByChainID } from './useChainList'
import toast from 'react-hot-toast'

export const useConnectIBCWallet = (
  tokenSymbol: string,
  chainId: string,
  mutationOptions?: Parameters<typeof useMutation>[2],
  fromRegistry?: boolean
) => {
  const [{ status }, setWalletState] = useRecoilState(ibcWalletState)

  if (tokenSymbol === '' || chainId === '') {
    return
  }

  let assetInfo = useIBCAssetInfo(tokenSymbol)
  if (fromRegistry) {
    assetInfo = useChainInfoByChainID(chainId)
  }

  const chainRegistryName = assetInfo ? assetInfo.registry_name : 'cosmostest'
  const { getSigningStargateClient, connect, address, assets } = useChain(chainRegistryName)

  const isMutatingRef = useRef(false) // Track mutation state using useRef

  const mutation = useMutation(async () => {
    if (isMutatingRef.current) return // Prevent multiple calls during mutation
    if (!tokenSymbol) {
      throw new Error(
        'You must provide `tokenSymbol` before connecting to the wallet.'
      )
    }

    if (!assetInfo) {
      throw new Error(
        'Asset info for the provided `tokenSymbol` was not found. Check your internet connection.'
      )
    }

    setWalletState((value) => ({
      ...value,
      tokenSymbol,
      state: WalletStatusType.connecting,
    }))

    isMutatingRef.current = true // Mutation is in progress

    try {
      if (address) {
        const ibcChainClient = await getSigningStargateClient()

        setWalletState({
          tokenSymbol,
          address,
          client: ibcChainClient,
          status: WalletStatusType.connected,
          assets,
        })
      } else {
        throw new Error('Failed to obtain the client')
      }
    } catch (e) {
      toast.error(e.message)
      setWalletState({
        tokenSymbol: null,
        address: '',
        client: null,
        status: WalletStatusType.error,
        assets: undefined,
      })

      throw e
    } finally {
      isMutatingRef.current = false // Reset mutation flag
    }
  }, mutationOptions)

  useEffect(() => {
    if (status === WalletStatusType.restored && assetInfo && !isMutatingRef.current) {
      connect()
      mutation.mutate(null)
    }
  }, [status, assetInfo, connect, mutation])

  return mutation
}
