import { useEffect } from 'react'
import { useMutation } from 'react-query'
import { useRecoilState } from 'recoil'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { useChain } from '@cosmos-kit/react'
export const useAfterConnectWallet = (
  mutationOptions?: Parameters<typeof useMutation>[2]
) => {
  let { connect, getSigningStargateClient, address, username } =
    useChain('trustlesshub')

  const [{ status, client }, setWalletState] = useRecoilState(walletState)

  const mutation = useMutation(async () => {
    setWalletState((value) => ({
      ...value,
      state: WalletStatusType.connecting,
    }))

    try {
      if (address && !client) {
        const trstChainClient = await getSigningStargateClient()
        if (trstChainClient) {
          //console.log("CLIENT", trstChainClient)
          setWalletState({
            key: username,
            address,
            client: trstChainClient,
            status: WalletStatusType.connected,
            assets: undefined,
          })
        } else {
          // Handle the case where the client could not be obtained
          throw new Error('Failed to obtain the client')
        }
      }
    } catch (error) {
      console.error('Error connecting the wallet:', error)
      setWalletState({
        status: WalletStatusType.error,
        address: '',
        client: null,
        assets: undefined,
      })
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
