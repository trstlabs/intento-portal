import { useQuery } from 'react-query'
import { useRecoilValue } from 'recoil'

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
import { cosmos } from 'intentojs'

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
        (account) =>
          account.icaConfig.connectionId == connectionId &&
          process.env.NEXT_PUBLIC_AGENT_LIST.includes(account.agentAddress)
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

export const useGetTrustlessAgentICAByTrustlessAgentAddress = (
  address: string
) => {
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

export const useGetTrustlessAgentICAAddress = (
  accAddr: string,
  connectionId: string
) => {
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

  const enabled =
    !!ibcWalletAddress &&
    !!chainId &&
    !!isICAChain &&
    !!chain?.rpc &&
    !!chain?.denom

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

interface UseAuthZMsgGrantInfoResult {
  grants: GrantResponse[]
  isLoading: boolean
  error: Error | null
}

export const useAuthZMsgGrantInfoForUser = (
  grantee: string,
  flowInput?: FlowInput
): UseAuthZMsgGrantInfoResult => {
  const ibcState = useRecoilValue(ibcWalletState)
  const chain = useChainInfoByChainID(ibcState.chainId)

  // Base query key without the status to invalidate all related queries
  const baseQueryKey = `userAuthZGrants/${grantee}/${ibcState.address}/${flowInput?.msgs?.length}`

  const { data, isLoading, error } = useQuery<GrantResponse[], Error>(
    [baseQueryKey],
    async () => {
      if (!flowInput?.msgs?.length) {
        return []
      }

      let grants: GrantResponse[] = []
      let granteeGrants
      const client = await cosmos.ClientFactory.createRPCQueryClient({
        rpcEndpoint: chain.rpc,
      })
      try {
        granteeGrants =
          (await getAuthZGrantsForGrantee({
            grantee,
            granter: ibcState.address,
            client
          })) || []
      } catch (err) {
        console.error('Error fetching grants:', err)
        throw new Error(`Failed to fetch grants: ${err.message}`)
      }

      for (const msg of flowInput.msgs) {
        try {
          const parsedMsg = JSON.parse(msg)
          const msgTypeUrl = parsedMsg.typeUrl

          if (!msgTypeUrl) {
            console.warn('Message missing typeUrl:', parsedMsg)
            continue
          }

          if (msgTypeUrl === '/cosmos.authz.v1beta1.MsgExec') {
            // Handle nested MsgExec
            const execMsgs = parsedMsg.value?.msgs || []
            for (const execMsg of execMsgs) {
              const execMsgTypeUrl = execMsg.typeUrl
              if (!execMsgTypeUrl) continue

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
          throw new Error(`Error processing message: ${error.message}`)
        }
      }

      return grants
    },
    {
      enabled: Boolean(
        ibcState.status === WalletStatusType.connected &&
          ibcState.address &&
          grantee &&
          flowInput?.connectionId &&
          flowInput?.msgs?.length > 0
      ),
      refetchOnMount: false, // don’t refetch if data is cached
      refetchOnWindowFocus: false, // don’t spam when tab focus changes
      refetchInterval: false, // disable auto-polling
      staleTime: 5 * 60 * 1000, // data is fresh for 5 min
      cacheTime: 10 * 60 * 1000, // keep it cached for 10 min
      onError: (error) => {
        console.error('Error in useAuthZMsgGrantInfoForUser:', error)
      },
    }
  )

  return {
    grants: data || [],
    isLoading,
    error: error || null,
  }
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
