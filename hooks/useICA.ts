import { useQuery, useQueryClient } from 'react-query'
import { useRecoilValue } from 'recoil'
import { useEffect, useRef } from 'react'

import {
  ibcWalletState,
  walletState,
  WalletStatusType,
} from '../state/atoms/walletAtoms'
import { DEFAULT_LONG_REFETCH_INTERVAL } from '../util/constants'
import {
  getICA,
  getAuthZGrantsForGrantee,
  getFeeGrantAllowance,
  GrantResponse,
  getTrustlessAgents,
  getTrustlessAgent,
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
        accAddr.length > 30
      ),
      refetchOnMount: true,
      staleTime: 60000,
      cacheTime: 300000,
    }
  )

  return [ica, isLoading] as const
}

export const useGetTrustlessAgentICAByConnectionID = (connectionId: string) => {
  const rpcClient = useIntentoRpcClient()
  const { data: ica, isLoading } = useQuery(
    `trustlessAgent/${connectionId}`,
    async () => {
      console.log(connectionId)
      const trustlessAgents = await getTrustlessAgents({ rpcClient })
      const trustlessAgent = trustlessAgents?.find(
        (account) => account.icaConfig.connectionId == connectionId && process.env.NEXT_PUBLIC_AGENT_LIST.includes(account.agentAddress)
      )
      return trustlessAgent
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


export const useGetTrustlessAgentICAByTrustlessAgentAddress = (address: string) => {
  const rpcClient = useIntentoRpcClient()
  const { data: ica, isLoading } = useQuery(
    `trustlessAgentByAddress/${address}`,
    async () => {
      const trustlessAgents = await getTrustlessAgents({ rpcClient })
      const trustlessAgent = trustlessAgents?.find(
        (account) => account.agentAddress == address
      )

      return trustlessAgent
    },
    {
      enabled: Boolean(address && rpcClient),
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
    `connectionIDFromHostAddress/${address}`,
    async () => {
      const resp = await getTrustlessAgent({ rpcClient, address })

      return resp.trustlessAgent.icaConfig.connectionId
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

export const useGetTrustlessAgentICAAddress = (accAddr: string, connectionId: string) => {
  const rpcClient = useIntentoRpcClient()
  const { data: ica, isLoading } = useQuery(
    `hostInterchainAccount/${connectionId}/${accAddr}`,
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

  const enabled = !!ibcWalletAddress && !!chainId && !!isICAChain && !!chain?.rpc && !!chain?.denom

  const { data, isLoading } = useQuery(
    [`icaTokenBalance`, chainId, ibcWalletAddress],
    async () => {
      const { denom, decimals } = chain!
      const chainClient = await StargateClient.connect(chain.rpc)
      const coin = await chainClient.getBalance(ibcWalletAddress, denom)
      const amount = coin ? Number(coin.amount) : 0

      return convertMicroDenomToDenom(amount, decimals)
    },
    {
      enabled,
      refetchOnMount: 'always',
      refetchInterval: 60000,
      staleTime: 30000,
      cacheTime: 1000000,
      refetchOnWindowFocus: true,
    }
  )

  return [data, isLoading] as const
}


export const useAuthZMsgGrantInfoForUser = (
  grantee: string,
  flowInput?: FlowInput
) => {
  const ibcState = useRecoilValue(ibcWalletState)
  const chain = useChainInfoByChainID(ibcState.chainId)
  const prevAddressRef = useRef(ibcState.address)
  const queryClient = useQueryClient()

  // Base query key without the status to invalidate all related queries
  const baseQueryKey = `userAuthZGrants/${grantee}/${ibcState.address}`

  const { data, isLoading, refetch } = useQuery(
    [baseQueryKey, ibcState.status], // Include status in the query key array
    async () => {
      if (!ibcState.address || !grantee || !flowInput?.connectionId) {
        return []
      }

      let grants: GrantResponse[] = []
      const granteeGrants = await getAuthZGrantsForGrantee({
        grantee,
        granter: ibcState.address,
        rpc: chain.rpc,
      })

      if (!granteeGrants) return []

      for (const msg of flowInput.msgs) {
        try {
          const parsedMsg = JSON.parse(msg)
          const msgTypeUrl = parsedMsg.typeUrl

          if (msgTypeUrl === '/cosmos.authz.v1beta1.MsgExec') {
            // Handle nested MsgExec
            const execMsgs = parsedMsg.value?.msgs || []
            for (const execMsg of execMsgs) {
              const execMsgTypeUrl = execMsg.typeUrl
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
            // Handle direct message types
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
        } catch (error) {
          console.error('Error processing message:', msg, error)
        }
      }

      return grants
    },
    {
      enabled: Boolean(
        ibcState.status === WalletStatusType.connected &&
        ibcState.address &&
        grantee &&
        flowInput?.connectionId
      ),
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      refetchInterval: 10000, // Reduce refetch interval to 10 seconds
      staleTime: 5000, // Reduce stale time to 5 seconds
      cacheTime: 60000, // Cache for 1 minute
      // Force refetch when wallet address changes
      refetchOnReconnect: true,
      notifyOnChangeProps: ['data', 'error']
    }
  )

  // Invalidate and refetch when wallet address changes
  useEffect(() => {
    if (ibcState.address && ibcState.address !== prevAddressRef.current) {
      prevAddressRef.current = ibcState.address
      // Invalidate all queries for this grantee/address combination
      queryClient.invalidateQueries(baseQueryKey, { refetchActive: true, refetchInactive: true })
    }
  }, [ibcState.address, queryClient, baseQueryKey])

  // Also refetch when the wallet status changes to connected
  useEffect(() => {
    if (ibcState.status === WalletStatusType.connected) {
      refetch()
    }
  }, [ibcState.status, refetch])

  return { grants: data || [], isLoading, refetch }
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
