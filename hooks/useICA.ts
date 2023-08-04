import { useQuery } from 'react-query'
import { useRecoilValue } from 'recoil'

import { ibcWalletState, walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { DEFAULT_REFETCH_INTERVAL } from '../util/constants'
import { getICA, /* getIsActiveICA, */ getAuthZGrants, getFeeGrantAllowance, AutoTxData, GrantResponse } from '../services/ica'
// import { Grant } from 'trustlessjs/dist/protobuf/cosmos/authz/v1beta1/authz'
import { SigningStargateClient } from '@cosmjs/stargate'
import { convertMicroDenomToDenom } from 'junoblocks'
import { useIBCAssetInfo } from './useIBCAssetInfo'

import {  useTrstRpcClient } from './useRPCClient'

export const useGetICA = (connectionId: string, accAddr?: string) => {

  if (accAddr === "") {
    const { address } = useRecoilValue(walletState)
    accAddr = address
  }

  const rpcClient = useTrstRpcClient()
  const { data: ica, isLoading } = useQuery(
    [`interchainAccount/${connectionId}`, connectionId],
    async () => {

      const resp: string = await getICA({ owner: accAddr, connectionId, rpcClient })
      return resp

    },
    {
      enabled: Boolean(connectionId != "" && connectionId != undefined && rpcClient),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,

    },
  )

  return [ica, isLoading] as const


}

export const useICATokenBalance = (tokenSymbol: string, nativeWalletAddress: string) => {
  const ibcAsset = useIBCAssetInfo(tokenSymbol)
  const { data, isLoading } = useQuery(
    [`icaTokenBalance/${tokenSymbol}`, nativeWalletAddress],
    async () => {
      const { denom, decimals, chain_id, rpc } = ibcAsset

      await window.keplr.enable(chain_id)
      //const offlineSigner = await window.keplr.getOfflineSigner(chain_id)

      const chainClient = await SigningStargateClient.connect(
        rpc,
        //offlineSigner
      )

      // const [{ address }] = await offlineSigner.getAccounts()
      const coin = await chainClient.getBalance(nativeWalletAddress, denom)
      // console.log(coin)
      const amount = coin ? Number(coin.amount) : 0

      return convertMicroDenomToDenom(amount, decimals)
    },
    {
      enabled: Boolean(tokenSymbol && nativeWalletAddress && ibcAsset),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    }
  )

  return [data, isLoading] as const
}


export const useAuthZGrantsForUser = (granter: string, tokenSymbol: string, autoTxData?: AutoTxData) => {

  const ibcAsset = useIBCAssetInfo(tokenSymbol)
  let ibcState = useRecoilValue(ibcWalletState)

  const { data, isLoading } = useQuery(
    ['userAuthZGrants', granter],
    async () => {
      let grants: GrantResponse[] = []
      const { rpc } = ibcAsset
      for (const msg of autoTxData.msgs) {
        let url = JSON.parse(msg)["typeUrl"];
        console.log(url)
        const grant = await getAuthZGrants({ grantee: ibcState.address, granter, msgTypeUrl: url.toString(), rpc })
        grants.push(grant)

        // typeUrls.push(grant.msgTypeUrl)
      }

      if (!grants[0]) {
        return
      }

      return grants

    },
    {
      enabled: Boolean(granter && ibcAsset && ibcState.address.includes(ibcAsset.prefix) && granter.includes(ibcAsset.prefix) && autoTxData.msgs[0] && autoTxData.msgs[0].includes("typeUrl") && ibcState.status === WalletStatusType.connected && ibcState.client && ibcState.address),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    },
  )

  return [data, isLoading] as const
}



export const useFeeGrantAllowanceForUser = (granter: string) => {
  const { status, client, address } = useRecoilValue(walletState)

  const { data, isLoading } = useQuery(
    ['granter', granter],
    async () => {

      const resp = await getFeeGrantAllowance({ grantee: address, granter, client })
      console.log("feegrant: ", resp)
      return resp

    },
    {
      enabled: Boolean(granter != "" && status === WalletStatusType.connected && client && address),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  )

  return [data, isLoading] as const


}
