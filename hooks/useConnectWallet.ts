import { useEffect } from 'react'
import { useMutation } from 'react-query'
import { useRecoilState } from 'recoil'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { useChain } from '@cosmos-kit/react'

export const useAfterConnectWallet = (
  mutationOptions?: Parameters<typeof useMutation>[2]
) => {
  let {

    connect,
    getSigningStargateClient,
    address,
    username,
  } = useChain('trustlesshub')

  const [{ status, client}, setWalletState] = useRecoilState(walletState)

  const mutation = useMutation(async () => {
    setWalletState((value) => ({
      ...value,
      client: null,
      state: WalletStatusType.connecting,
    }))

    try {
      if (address != undefined && (client == null ||client == undefined)) {
      const trstChainClient = await getSigningStargateClient()

      console.log('trstChainClient', trstChainClient)
      
        /* successfully update the wallet state */
        setWalletState({
          key: username,
          address,
          client: trstChainClient,
          status: WalletStatusType.connected,
          rpc: '',
        })
      }
    } catch (error) {
      setWalletState({
        key: null,
        address: '',
        client: null,
        status: WalletStatusType.error,
        rpc: '',
      })

      /* throw the error for the UI */
      throw error
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
