import { useEffect } from 'react'
import { useMutation } from 'react-query'
import { useRecoilState } from 'recoil'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { useChain } from '@cosmos-kit/react'
export const useAfterConnectWallet = (
  mutationOptions?: Parameters<typeof useMutation>[2],
) => {
  let { connect, getSigningStargateClient, address, username } =
    useChain('intentotestnet')

  const [{ status }, setWalletState] = useRecoilState(walletState)
  const mutation = useMutation(async () => {
    setWalletState((value) => ({
      ...value,
      state: WalletStatusType.connecting,
    }))
    console.log(username, address)
    try {
      if (address) {
        const chainClient = await getSigningStargateClient()

        if (chainClient) {
          setWalletState({
            key: username,
            address,
            client: chainClient,
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
    }, 
    [status]
  )


  return mutation
}
