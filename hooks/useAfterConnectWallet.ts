import { useEffect, useRef} from 'react'
import { useMutation } from 'react-query'
import { useRecoilState } from 'recoil'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { useChain } from '@cosmos-kit/react'

export const useAfterConnectWallet = (
  mutationOptions?: Parameters<typeof useMutation>[2]
) => {
  let { connect, getSigningStargateClient, address, username } = useChain('intentozone')

  const [{ status }, setWalletState] = useRecoilState(walletState)
  const isMutatingRef = useRef(false)  // Track mutation state using useRef

  const mutation = useMutation(async () => {
    if (isMutatingRef.current) return // Prevent multiple calls during mutation

    isMutatingRef.current = true
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
    } finally {
      isMutatingRef.current = false // Reset mutation flag
    }
  }, mutationOptions)

  useEffect(() => {
    if (status === WalletStatusType.restored && !isMutatingRef.current) {
      // Only restore wallet connection if status is restored and mutation is not in progress
      connect()
      mutation.mutate(null)
    }
  }, [status, connect, mutation])

  return mutation
}
