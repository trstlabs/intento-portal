//import { AminoConverters } from 'trustlessjs'
import {
  AminoTypes,
  createAuthzAminoConverters,
  createIbcAminoConverters,
  defaultRegistryTypes as defaultStargateTypes,
  GasPrice,
  SigningStargateClient,
} from '@cosmjs/stargate'
import { useEffect } from 'react'
import { useMutation } from 'react-query'
import { useRecoilState } from 'recoil'
import { ChainInfo } from '@keplr-wallet/types'
import { ibcWalletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { GAS_PRICE } from '../util/constants'
import { useIBCAssetInfo } from './useIBCAssetInfo'
import { useChainInfo } from './useChainInfo'
import { MsgGrant } from 'trustlessjs/dist/protobuf/cosmos/authz/v1beta1/tx'

import { Registry } from '@cosmjs/proto-signing'



/* shares very similar logic with `useConnectWallet` and is a subject to refactor */
export const useConnectIBCWallet = (
  tokenSymbol: string,
  mutationOptions?: Parameters<typeof useMutation>[2]
) => {
  const [{ status, tokenSymbol: storedTokenSymbol }, setWalletState] =
    useRecoilState(ibcWalletState)

  const assetInfo = useIBCAssetInfo(tokenSymbol || storedTokenSymbol)

  const mutation = useMutation(async () => {
    if (window && !window?.keplr) {
      alert('Please install Keplr extension and refresh the page.')
      return
    }

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

      const { chain_id, rpc } = assetInfo


      const customRegistry = new Registry(defaultStargateTypes);
      customRegistry.register("/cosmos.authz.v1beta1.MsgGrant", MsgGrant);
      await window.keplr.enable(chain_id)

      const offlineSigner = await window.keplr.getOfflineSignerAuto(chain_id)
      //console.log(offlineSigner)
      const ibcChainClient = await SigningStargateClient.connectWithSigner(
        rpc,
        offlineSigner,
        {
          gasPrice: GasPrice.fromString(GAS_PRICE),
          /*
           * passing ibc amino types for all the amino signers (eg ledger, wallet connect)
           * to enable ibc & wasm transactions
           * */
          aminoTypes: new AminoTypes(
            Object.assign(
              createIbcAminoConverters(),
              createAuthzAminoConverters(),
              //createWasmAminoConverters()
            )
          ),
          registry: customRegistry,
        },

      )

      const [{ address }] = await offlineSigner.getAccounts()

      /* successfully update the wallet state */
      setWalletState({
        tokenSymbol,
        address,
        client: ibcChainClient,
        status: WalletStatusType.connected,
      })
    } catch (e) {
      /* set the error state */
      setWalletState({
        tokenSymbol: null,
        address: '',
        client: null,
        status: WalletStatusType.error,
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
