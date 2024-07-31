import { useQuery } from 'react-query'
import { useRecoilValue } from 'recoil'

import {
  ibcWalletState,
  walletState,
  WalletStatusType,
} from '../state/atoms/walletAtoms'
import {
  DEFAULT_LONG_REFETCH_INTERVAL,
  DEFAULT_REFETCH_INTERVAL,
} from '../util/constants'
import {
  getICA,
  getAuthZGrantsForGrantee,
  getFeeGrantAllowance,
  GrantResponse,
  getHostedAccounts,
} from '../services/build'

import { StargateClient } from '@cosmjs/stargate'
import { convertMicroDenomToDenom } from 'junoblocks'

import { useIntentoRpcClient } from './useRPCClient'
import { ActionInput } from '../types/trstTypes'
import { useChainInfoByChainID } from './useChainList'

export const useGetICA = (connectionId: string, accAddr?: string) => {
  const { address } = useRecoilValue(walletState)

  if (accAddr === '') {
    accAddr = address
  }

  const rpcClient = useIntentoRpcClient()
  const { data: ica, isLoading } = useQuery(
    `interchainAccount/${connectionId}`,
    async () => {
      if (connectionId == '') {
        return ''
      }
      const resp: string = await getICA({
        owner: accAddr,
        connectionId,
        rpcClient,
      })
      return resp
    },
    {
      enabled: Boolean(
        connectionId != undefined &&
          rpcClient &&
          !!accAddr &&
          accAddr.length > 40
      ),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [ica, isLoading] as const
}

export const useGetHostedICA = (connectionId: string) => {
  const rpcClient = useIntentoRpcClient()
  const { data: ica, isLoading } = useQuery(
    `hostedAccount/${connectionId}`,
    async () => {
      if (connectionId == '') {
        return ''
      }
      const hostedAccs = await getHostedAccounts({ rpcClient })
      // console.log(hostedAccs)
      const hostedAcc = hostedAccs?.find(
        (account) => account.icaConfig.connectionId == connectionId
      )
      // const resp: string = await getICA({
      //   owner: hostedAcc.hostedAddress,
      //   connectionId,
      //   rpcClient,
      // })
      return hostedAcc
    },
    {
      enabled: Boolean(connectionId && rpcClient),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [ica, isLoading] as const
}


export const useGetHostICAAddress = (connectionId: string, accAddr?: string) => {
  const { address } = useRecoilValue(walletState)

  if (accAddr === '') {
    accAddr = address
  }

  const rpcClient = useIntentoRpcClient()
  const { data: ica, isLoading } = useQuery(
    `hostInterchainAccount/${connectionId}/${address}`,
    async () => {
      if (connectionId == '') {
        return ''
      }
      const resp: string = await getICA({
        owner: accAddr,
        connectionId,
        rpcClient,
      })
      return resp
    },
    {
      enabled: Boolean(
        connectionId != undefined &&
          rpcClient &&
          !!accAddr &&
          accAddr.length > 40
      ),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [ica, isLoading] as const
}

export const useICATokenBalance = (
  chainId: string,
  ibcWalletAddress: string,
  isICAChain: boolean
) => {
  const chain = useChainInfoByChainID(chainId)
  const { denom, decimals } = chain
  const { data, isLoading } = useQuery(
    `icaTokenBalance/${chainId}/${ibcWalletAddress}`,
    async () => {
      const chainClient = await StargateClient.connect(chain.rpc)
      const coin = await chainClient.getBalance(ibcWalletAddress, denom)

      const amount = coin ? Number(coin.amount) : 0

      return convertMicroDenomToDenom(amount, decimals)
    },
    {
      enabled: Boolean(
        ibcWalletAddress && denom && ibcWalletAddress != '' && isICAChain
      ),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}

export const useAuthZGrantsForUser = (
  chainId: string,
  grantee: string,
  ActionInput?: ActionInput
) => {
  const ibcState = useRecoilValue(ibcWalletState)
  const chain = useChainInfoByChainID(chainId)

  // console.log('granter ', ibcState.address, 'grantee ', grantee)
  const { data, isLoading } = useQuery(
    [`userAuthZGrants/${grantee}/${chainId}`],
    async () => {
      // console.log(ibcState.status)

      let grants: GrantResponse[] = []
      // console.log('granter ', ibcState.address, 'grantee ', grantee)
      const granteeGrants = await getAuthZGrantsForGrantee({
        grantee,
        granter: ibcState.address,
        rpc: chain.rpc,
      })
      if (granteeGrants != false) {
        console.log(grants, grantee, ibcState)

        for (const msg of ActionInput.msgs) {
          let msgTypeUrl = JSON.parse(msg)['typeUrl']
          // console.log(msgTypeUrl)
          const grantMatch = granteeGrants?.find(
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
        // console.log('grants', grants)
        return grants
      }
      return undefined
    },
    {
      enabled: Boolean(
        grantee &&
          chain &&
          chain.rpc &&
          grantee != '' &&
          chainId &&
          ibcState.status === WalletStatusType.connected &&
          grantee.includes(ibcState.address.slice(0, 5)) &&
          ActionInput.msgs[0] &&
          ActionInput.msgs[0].includes('typeUrl') &&
          ActionInput.connectionId
      ),
      refetchOnMount: 'always',
      refetchIntervalInBackground: true,
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
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
