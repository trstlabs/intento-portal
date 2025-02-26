import { useQuery } from 'react-query'
import { useRecoilValue } from 'recoil'

import {
  ibcWalletState,
  walletState,
  WalletStatusType,
} from '../state/atoms/walletAtoms'
import {
  DEFAULT_LONG_REFETCH_INTERVAL,
} from '../util/constants'
import {
  getICA,
  getAuthZGrantsForGrantee,
  getFeeGrantAllowance,
  GrantResponse,
  getHostedAccounts,
  getHostedAccount,
} from '../services/build'

import { StargateClient } from '@cosmjs/stargate'
import { convertMicroDenomToDenom } from 'junoblocks'

import { useIntentoRpcClient } from './useRPCClient'
import { FlowInput } from '../types/trstTypes'
import { useChainInfoByChainID } from './useChainList'

export const useGetICA = (connectionId: string, accAddr?: string) => {
  const { address } = useRecoilValue(walletState)

  if (accAddr === '') {
    accAddr = address
  }

  const rpcClient = useIntentoRpcClient()
  const { data: ica, isLoading } = useQuery(
    `interchainAccount/${connectionId}/${address}`,
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
      refetchOnMount: false,
      staleTime: 30000,
      cacheTime: 300000,
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
      //   owner: hostedAcc.address,
      //   connectionId,
      //   rpcClient,
      // })
      return hostedAcc
    },
    {
      enabled: Boolean(connectionId && rpcClient),
      refetchOnMount: false,
      staleTime: 30000,
      cacheTime: 300000,
    }
  )

  return [ica, isLoading] as const
}

export const useGetHostICAAddressFromHostAddress = (address: string) => {
  const rpcClient = useIntentoRpcClient()

  const { data: ica, isLoading } = useQuery(
    `geHostICAAddressFromHostAddress/${address}`,
    async () => {
      const resp = await getHostedAccount({ rpcClient, address })
      let [icaAddress, _] = useGetHostICAAddress(
        resp.hostedAccount.icaConfig.connectionId
      )
      return icaAddress
    },
    {
      enabled: Boolean(rpcClient && !!address && address.length > 40),
      refetchOnMount: false,
      staleTime: 30000,
      cacheTime: 300000,
    }
  )

  return [ica, isLoading] as const
}

export const useGetConnectionIDFromHostAddress = (address: string) => {
  const rpcClient = useIntentoRpcClient()

  const { data: connectionID, isLoading } = useQuery(
    `geHostICAAddressFromHostAddress/${address}`,
    async () => {
      const resp = await getHostedAccount({ rpcClient, address })

      return resp.hostedAccount.icaConfig.connectionId
    },
    {
      enabled: Boolean(rpcClient && !!address && address.length > 40),
      refetchOnMount: false,
      staleTime: 30000,
      cacheTime: 300000,
    }
  )

  return [connectionID, isLoading] as const
}

export const useGetHostICAAddress = (
  connectionId: string,
  accAddr?: string
) => {
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
      refetchOnMount: false,
      staleTime: 30000,
      cacheTime: 300000,
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
        ibcWalletAddress &&
          chainId &&
          chainId != '' &&
          ibcWalletAddress != '' &&
          ibcWalletAddress.length != 0 &&
          isICAChain
      ),
      refetchOnMount: 'always', // Refetch when the component mounts
      refetchInterval: 30000,    // Refetch every 30 seconds
      staleTime: 15000,           // Cache expires after 15 seconds
      cacheTime: 300000,         // Cache data for 5 minutes
      refetchOnWindowFocus: true,
    }
  )

  return [data, isLoading] as const
}

export const useAuthZMsgGrantInfoForUser = (
  chainId: string,
  grantee: string,
  flowInput?: FlowInput
) => {
  const ibcState = useRecoilValue(ibcWalletState)
  const chain = useChainInfoByChainID(chainId)

  const { data, isLoading } = useQuery(
    [`userAuthZGrants/${grantee}/${chainId}/${flowInput}`],
    async () => {
      let grants: GrantResponse[] = []
      const granteeGrants = await getAuthZGrantsForGrantee({
        grantee,
        granter: ibcState.address,
        rpc: chain.rpc,
      })
      if (!granteeGrants) return undefined
      // console.log(granteeGrants)
      for (const msg of flowInput.msgs) {
        let parsedMsg = JSON.parse(msg)
        let msgTypeUrl = parsedMsg.typeUrl
        if (msgTypeUrl === '/cosmos.authz.v1beta1.MsgExec') {
          // Extract messages from MsgExec
          const execMsgs = parsedMsg.value.msgs || []
          for (const execMsg of execMsgs) {
            // console.log(execMsg)
            let execMsgTypeUrl = execMsg.typeUrl
            // console.log(execMsgTypeUrl)
            const grantMatch = granteeGrants.find(
              (grant) => grant.msgTypeUrl === execMsgTypeUrl
            )

            grants.push(
              grantMatch || {
                msgTypeUrl: execMsgTypeUrl,
                expiration: undefined,
                hasGrant: false,
              }
            )
          }
        } else {
          const grantMatch = granteeGrants.find(
            (grant) => grant.msgTypeUrl === msgTypeUrl
          )

          grants.push(
            grantMatch || {
              msgTypeUrl,
              expiration: undefined,
              hasGrant: false,
            }
          )
        }
      }
      console.log('grants', grants)
      return grants
    },
    {
      enabled: Boolean(
        grantee &&
          chain &&
          chain.rpc &&
          grantee !== '' &&
          chainId &&
          ibcState.status === WalletStatusType.connected &&
          grantee.includes(ibcState.address.slice(0, 5)) &&
          flowInput.msgs[0] &&
          flowInput.msgs[0].includes('typeUrl') &&
          flowInput.connectionId
      ),
      refetchOnMount: 'always', // Refetch when the component mounts
      refetchInterval: 30000,    // Refetch every 30 seconds
      staleTime: 15000,           // Cache expires after 15 seconds
      cacheTime: 300000,         // Cache data for 5 minutes
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
