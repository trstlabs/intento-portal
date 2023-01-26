import { useQuery } from 'react-query'
import { useRecoilValue } from 'recoil'

import { ibcWalletState, walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL } from '../util/constants'
import { getICA, getGrants, getFeeGrantAllowance, getBalanceForICA } from '../services/ica'
import { Grant } from 'trustlessjs/dist/protobuf/cosmos/authz/v1beta1/authz'
import { SigningStargateClient } from '@cosmjs/stargate'
import { convertMicroDenomToDenom } from 'junoblocks'
import { useIBCAssetInfo } from './useIBCAssetInfo'

export const useICAForUser = (connectionId: string) => {
  const { status, client } = useRecoilValue(walletState)

  const { data: ica, isLoading } = useQuery(
    ['connection_id', connectionId],
    async () => {

      const resp: string = await getICA({ owner: client.address, connectionId, client })

      return resp

    },
    {
      enabled: Boolean(connectionId != "" && connectionId != undefined && status === WalletStatusType.connected && client && client.address),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  )

  return [ica, isLoading] as const


}

export const useGetGrantForUser = (granter: string, msgTypeUrl: string) => {
  const { status, client } = useRecoilValue(walletState)

  const { data, isLoading } = useQuery(
    ['granter', granter],
    async () => {

      const resp: Grant[] = await getGrants({ grantee: client.address, granter, msgTypeUrl, client })

      return resp

    },
    {
      enabled: Boolean(msgTypeUrl != "" && status === WalletStatusType.connected && client && client.address),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  )

  return [data, isLoading] as const


}


export const useGetBalanceForICA = (ica: string) => {
  const { status, client } = useRecoilValue(ibcWalletState)

  const { data, isLoading } = useQuery(
    ['ica', ica],
    async () => {

      const resp = await getBalanceForICA({ ica, client })
      return resp

    },
    {
      enabled: Boolean(status === WalletStatusType.connected && client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  )

  return [data, isLoading] as const


}

export const useICATokenBalance = (tokenSymbol: string, nativeWalletAddress: string) => {
  const ibcAsset = useIBCAssetInfo(tokenSymbol)
  const { data: balance = 0, isLoading } = useQuery(
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

      const amount = coin ? Number(coin.amount) : 0

      return convertMicroDenomToDenom(amount, decimals)
    },
    {
      enabled: Boolean(nativeWalletAddress && ibcAsset),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    }
  )

  return [balance, isLoading]
}



export const useGrantsForUser = (granter: string, msgTypeUrl?: string) => {
  //console.log(msgTypeUrl)
  const { status, client } = useRecoilValue(walletState)

  const { data, isLoading } = useQuery(
    ['granter', granter],
    async () => {

      const resp: Grant[] = await getGrants({ grantee: client.address, granter, msgTypeUrl, client })

      return resp

    },
    {
      enabled: Boolean(msgTypeUrl != "" && status === WalletStatusType.connected && client && client.address),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  )

  return [data, isLoading] as const


}


export const useFeeGrantAllowanceForUser = (granter: string) => {
  const { status, client } = useRecoilValue(walletState)

  const { data, isLoading } = useQuery(
    ['granter', granter],
    async () => {

      const resp = await getFeeGrantAllowance({ grantee: client.address, granter, client })
      console.log("feegrant: ", resp)
      return resp

    },
    {
      enabled: Boolean(granter != "" && status === WalletStatusType.connected && client && client.address),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  )

  return [data, isLoading] as const


}
