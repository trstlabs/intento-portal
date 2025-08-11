import { useEffect } from 'react'
import { useMutation } from 'react-query'
import { useRecoilState } from 'recoil'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { useChain } from '@cosmos-kit/react'
import { addLocalChainToKeplr } from './useConnectIBCWallet'
export const useAfterConnectWallet = (
  mutationOptions?: Parameters<typeof useMutation>[2],
) => {
  let { connect, getSigningStargateClient, address, username } =
    useChain(process.env.NEXT_PUBLIC_INTO_REGISTRY_NAME)

  const [{ status }, setWalletState] = useRecoilState(walletState)
  const mutation = useMutation(async () => {
    setWalletState((value) => ({
      ...value,
      state: WalletStatusType.connecting,
    }))
    console.log(username, address)

    try {
      if (address) {
        if (process.env.NEXT_PUBLIC_INTO_REGISTRY_NAME.toLowerCase().includes("devnet")) {
          const added = await addLocalChainToKeplr(process.env.NEXT_PUBLIC_INTO_CHAIN_ID);
          if (added) {
            console.log('Chain added to Keplr, waiting for chain to be ready...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

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
