import { useQuery } from 'react-query'
import { useRecoilValue } from 'recoil'

import { ibcWalletState, walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { DEFAULT_REFETCH_INTERVAL } from '../util/constants'
import { getICA, /* getIsActiveICA, */ getGrants, getFeeGrantAllowance, AutoTxData, GrantResponse } from '../services/ica'
// import { Grant } from 'trustlessjs/dist/protobuf/cosmos/authz/v1beta1/authz'
import { SigningStargateClient } from '@cosmjs/stargate'
import { convertMicroDenomToDenom } from 'junoblocks'
import { useIBCAssetInfo } from './useIBCAssetInfo'

import { useTrustlessChainClient } from './useTrustlessChainClient'

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
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  )

  return [ica, isLoading] as const


}

/* 
export const useIsActiveICAForUser = (connectionId: string) => {
  const { status, client } = useRecoilValue(walletState)
  const { data: ica, isLoading } = useQuery(
    'useIsActiveICAForUser',
    async () => {
      console.log("useIsActiveICAForUser")
      const resp = await getIsActiveICA({ connectionId, portId: "icacontroller-" + client.address, client })
      return resp

    },
    {
      enabled: Boolean(status === WalletStatusType.connected && client && client.address),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  )

  return [ica, isLoading] as const
}
 */

export const useGetICA = (connectionId: string, accAddr: string) => {
  //const { status, client } = useRecoilValue(walletState)


  const client = useTrustlessChainClient()
  const { data: ica, isLoading } = useQuery(
    ['connection_id', connectionId],
    async () => {

      const resp: string = await getICA({ owner: accAddr, connectionId, client })
      return resp

    },
    {
      enabled: Boolean(connectionId != "" && connectionId != undefined && client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,

    },
  )

  return [ica, isLoading] as const


}
/* 
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
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  )

  return [data, isLoading] as const


} */


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
      enabled: Boolean(nativeWalletAddress && ibcAsset),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    }
  )

  return [data, isLoading] as const
}


export const useGrantsForUser = (granter: string, tokenSymbol: string, autoTxData?: AutoTxData) => {

  const ibcAsset = useIBCAssetInfo(tokenSymbol)
  const { status, client, address } = useRecoilValue(ibcWalletState)
  const { data, isLoading } = useQuery(
    ['granterGrants', granter],
    async () => {
      let grants: GrantResponse[] = []
      const { rpc } = ibcAsset
      for (const msg of autoTxData.msgs) {
        let url = JSON.parse(msg)["typeUrl"];
        console.log(url)
        const grant = await getGrants({ grantee: address, granter, msgTypeUrl: url.toString(), rpc })
        grants.push(grant)
        
        // typeUrls.push(grant.msgTypeUrl)
      }

      if (!grants[0]) {
        return
      }
      
      return grants

    },
    {
      enabled: Boolean(autoTxData.msgs[0] && autoTxData.msgs[0].includes("typeUrl") && status === WalletStatusType.connected && client && address),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
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
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  )

  return [data, isLoading] as const


}
