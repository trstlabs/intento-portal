//import { AminoConverters } from 'trustlessjs'

import { useEffect } from 'react'
import { useMutation } from 'react-query'
import { useRecoilState } from 'recoil'
import { ibcWalletState, WalletStatusType } from '../state/atoms/walletAtoms'

import { useIBCAssetInfo } from './useIBCAssetInfo'

import { useChain } from '@cosmos-kit/react'

/* shares very similar logic with `useConnectWallet` and is a subject to refactor */
export const useConnectIBCWallet = (
  tokenSymbol: string,
  _chainId: string,
  mutationOptions?: Parameters<typeof useMutation>[2]
) => {

  const [{ status, tokenSymbol: storedTokenSymbol }, setWalletState] =
    useRecoilState(ibcWalletState)

  const assetInfo = useIBCAssetInfo(tokenSymbol || storedTokenSymbol)


  const chainName = assetInfo ? assetInfo.registry_name : 'cosmoshub'
  const { isWalletConnected, getSigningStargateClient, connect, address, getRpcEndpoint } = useChain(chainName)

  const mutation = useMutation(async () => {

    if (!tokenSymbol && !storedTokenSymbol) {
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

      if (!isWalletConnected){
      await connect()
      await sleep(500)
    }
    

      const ibcChainClient = await getSigningStargateClient()

      console.log('ibcChainClient', ibcChainClient)

      const rpc = await getRpcEndpoint(true)
      /* successfully update the wallet state */
      setWalletState({
        tokenSymbol,
        address,
        client: ibcChainClient,
        status: WalletStatusType.connected,
        rpc,
      })
     
    } catch (e) {
      /* set the error state */
      setWalletState({
        tokenSymbol: null,
        address: '',
        client: null,
        status: WalletStatusType.error,
        rpc: ''
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
