import { useQuery } from 'react-query'
import { useRecoilValue } from 'recoil'

import {
  ibcWalletState,
  walletState,
  WalletStatusType,
} from '../state/atoms/walletAtoms'
import {
  DEFAULT_REFETCH_INTERVAL,
  DEFAULT_LONG_REFETCH_INTERVAL,
} from '../util/constants'
import {
  getICA,
  getAuthZGrantsForGrantee,
  getFeeGrantAllowance,
  GrantResponse,
} from '../services/automate'

import { StargateClient } from '@cosmjs/stargate'
import { convertMicroDenomToDenom } from 'junoblocks'
import { useIBCAssetInfo } from './useIBCAssetInfo'

import { useTrstRpcClient } from './useRPCClient'
import { AutoTxData } from '../types/trstTypes'

export const useGetICA = (connectionId: string, accAddr?: string) => {
  if (!connectionId ){
    return []
  }
  if (accAddr === '') {
    const { address } = useRecoilValue(walletState)
    accAddr = address
  }

  const rpcClient = useTrstRpcClient()
  const { data: ica, isLoading } = useQuery(
    [`interchainAccount/${connectionId}`, connectionId],
    async () => {
      const resp: string = await getICA({
        owner: accAddr,
        connectionId,
        rpcClient,
      })
      return resp
    },
    {
      enabled: Boolean(
        connectionId != '' &&
          connectionId != undefined &&
          accAddr != ''
      ),
      refetchOnMount: 'always',
    }
  )

  return [ica, isLoading] as const
}

export const useICATokenBalance = (
  tokenSymbol: string,
  nativeWalletAddress: string,
  isICAChain: boolean
) => {
  const ibcAsset = useIBCAssetInfo(tokenSymbol)
  const ibcState = useRecoilValue(ibcWalletState)

  const { data, isLoading } = useQuery(
    [`icaTokenBalance/${tokenSymbol}`, nativeWalletAddress],
    async () => {
      const { denom, decimals } = ibcAsset

      const chainClient = await StargateClient.connect(ibcState.rpc)

      const coin = await chainClient.getBalance(nativeWalletAddress, denom)

      const amount = coin ? Number(coin.amount) : 0

      return convertMicroDenomToDenom(amount, decimals)
    },
    {
      enabled: Boolean(
        tokenSymbol &&
          nativeWalletAddress != '' &&
          ibcAsset &&
          ibcState.tokenSymbol == tokenSymbol &&
          isICAChain
      ),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}

export const useAuthZGrantsForUser = (
  grantee: string,
  autoTxData?: AutoTxData
) => {
  const ibcState = useRecoilValue(ibcWalletState)
  // console.log('granter ', ibcState.address, 'grantee ', grantee)
  const { data, isLoading } = useQuery(
    ['userAuthZGrants', grantee],
    async () => {
      let grants: GrantResponse[] = []
      const ganteeGrants = await getAuthZGrantsForGrantee({
        grantee,
        granter: ibcState.address,
        rpc: ibcState.rpc,
      })

      for (const msg of autoTxData.msgs) {
        let msgTypeUrl = JSON.parse(msg)['typeUrl']
        console.log(msgTypeUrl)
        const grantMatch = ganteeGrants.find(
          (grant) => grant.msgTypeUrl == msgTypeUrl
        )
        if (grantMatch == undefined) {
          grants.push({
            msgTypeUrl,
            expiration: undefined,
            hasGrant: false,
          })
        } else {
          grants.push(grantMatch)
        }
        // typeUrls.push(grant.msgTypeUrl)
      }
      console.log('grants', grants)
      return grants
    },
    {
      enabled: Boolean(
        grantee &&
          autoTxData.msgs[0] &&
          autoTxData.msgs[0].includes('typeUrl') &&
          ibcState.status === WalletStatusType.connected &&
          ibcState.client &&
          ibcState.address &&
          autoTxData.connectionId
      ),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}

export const useFeeGrantAllowanceForUser = (granter: string) => {
  const { status, client, address } = useRecoilValue(walletState)

  const { data, isLoading } = useQuery(
    ['granter', granter],
    async () => {
      const resp = await getFeeGrantAllowance({
        grantee: address,
        granter,
        client,
      })
      console.log('feegrant: ', resp)
      return resp
    },
    {
      enabled: Boolean(
        granter != '' &&
          status === WalletStatusType.connected &&
          client &&
          address
      ),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    }
  )

  return [data, isLoading] as const
}
