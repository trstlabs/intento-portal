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
  // console.log('useConnectIBCWallet', tokenSymbol)
  const [{ status, tokenSymbol: storedTokenSymbol }, setWalletState] =
    useRecoilState(ibcWalletState)

  const assetInfo = useIBCAssetInfo(tokenSymbol || storedTokenSymbol)

  // console.log('assetInfo', assetInfo.registry_name)
  const chainName = assetInfo ? assetInfo.registry_name : 'cosmoshub'
  const { getSigningStargateClient, connect, address, getRpcEndpoint } = useChain(chainName)
  // const [chainInfo] = useIBCChainInfo(chainId)

  // chains.push({
  //   chain_name: chainInfo.chainName,
  //   chain_id: chainId,
  //   status: "live",
  //   network_type: 'testnet',
  //   pretty_name: chainInfo.chainName+'Trustless Hub Testnet',
  //   bech32_prefix: assetInfo.prefix,
  //   slip44: 118,
  //   fees: {
  //     fee_tokens: [
  //       {
  //         denom: assetInfo.denom,
  //         low_gas_price: 0.025,
  //         average_gas_price: 0.05,
  //         high_gas_price: 0.1,
  //       },
  //     ],
  //   },

  // })

  const mutation = useMutation(async () => {
    // if (window && !window?.keplr) {
    //   alert('Please install Keplr extension and refresh the page.')
    //   return
    // }

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
      await connect()
      await sleep(500)

      const ibcChainClient = await getSigningStargateClient()

      console.log('ibcChainClient', ibcChainClient)

      //const { address } = useChain(assetInfo.registry_name)
      // await window.keplr.experimentalSuggestChain(chainInfo)
      // await window.keplr.enable(chain_id)

      // const customRegistry = new Registry([
      //   ...defaultStargateTypes,
      //   ...registry,
      // ])
      // // customRegistry.register("/cosmos.authz.v1beta1.MsgGrant", MsgGrant);
      // await window.keplr.enable(chain_id)

      // const offlineSigner = await window.keplr.getOfflineSignerAuto(chain_id)
      // //console.log(offlineSigner)
      // const ibcChainClient = await SigningStargateClient.connectWithSigner(
      //   rpc,
      //   offlineSigner,
      //   {
      //     gasPrice: GasPrice.fromString(GAS_PRICE),
      //     /*
      //      * passing ibc amino types for all the amino signers (eg ledger, wallet connect)
      //      * to enable ibc & wasm transactions
      //      * */
      //     aminoTypes: new AminoTypes(
      //       Object.assign(
      //         createIbcAminoConverters(),
      //         createAuthzAminoConverters()
      //         //createWasmAminoConverters()
      //       )
      //     ),
      //     registry: customRegistry,
      //   }
      // )

      // const [{ address }] = await offlineSigner.getAccounts()
      const rpc = await getRpcEndpoint(true)
      console.log(rpc)
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
