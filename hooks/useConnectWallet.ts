import { useEffect } from 'react'
import { useMutation } from 'react-query'
import { useRecoilState } from 'recoil'

import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'

import { useChainInfo } from './useChainInfo'
import { useChain } from '@cosmos-kit/react'

export const useAfterConnectWallet = (
  mutationOptions?: Parameters<typeof useMutation>[2]
) => {
  const {
    connect,
    getSigningStargateClient,
    address,
    username,
  } = useChain('trustlesshub')

  const [{ status }, setWalletState] = useRecoilState(walletState)

  const [chainInfo] = useChainInfo()

  const mutation = useMutation(async () => {
    /* set the fetching state */
    setWalletState((value) => ({
      ...value,
      client: null,
      state: WalletStatusType.connecting,
    }))
    await sleep(500)
    try {
      
      console.log('address', address)

      const trstChainClient = await getSigningStargateClient()
      console.log('trstChainClient', trstChainClient)

      /* successfully update the wallet state */
      setWalletState({
        key: username,
        address,
        client: trstChainClient,
        status: WalletStatusType.connected,
      })
    } catch (e) {
      /* set the error state */
      setWalletState({
        key: null,
        address: '',
        client: null,
        status: WalletStatusType.error,
      })

      /* throw the error for the UI */
      throw e
    }
  }, mutationOptions)

  useEffect(
    function restoreWalletConnectionIfHadBeenConnectedBefore() {
      /* restore wallet connection if the state has been set with the */
      if (chainInfo?.rpc && status === WalletStatusType.restored) {
        connect()
        mutation.mutate(null)
      }
    }, // eslint-disable-next-line
    [status, chainInfo?.rpc]
  )

  useEffect(
    function listenToWalletAddressChangeInKeplr() {
      function reconnectWallet() {
        if (status === WalletStatusType.connected) {
          connect()
          mutation.mutate(null)
        }
      }

      window.addEventListener('keplr_keystorechange', reconnectWallet)
      return () => {
        window.removeEventListener('keplr_keystorechange', reconnectWallet)
      }
    },
    // eslint-disable-next-line
    [status]
  )

  return mutation
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
