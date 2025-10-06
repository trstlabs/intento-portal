import { ChainInfo } from '@keplr-wallet/types'
import { useQuery } from 'react-query'
import { queryClient } from '../services/queryClient'

import { getExpectedFlowFee, getFlowParams, getStakeBalanceForAcc, getAPR, getModuleParams } from '../services/chain-info'
import { convertMicroDenomToDenom } from '../util/conversion'
import { cosmos } from 'intentojs'
import {
  DEFAULT_REFETCH_INTERVAL,
  DEFAULT_LONG_REFETCH_INTERVAL,
} from '../util/constants'

import {
  useIntentoRpcClient,
  useCosmosRpcClient,
  useTendermintRpcClient,
} from './useRPCClient'
import { useRecoilState, useRecoilValue } from 'recoil'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'

import {
  paramsStateAtom,
  intentModuleParamsAtom,
} from '../state/atoms/moduleParamsAtoms'
import { useEffect, useMemo } from 'react'
import { FlowInput } from '../types/trstTypes'

const chainInfoQueryKey = '@chain-info'

export const unsafelyReadChainInfoCache = () =>
  queryClient.getQueryCache().find(chainInfoQueryKey)?.state?.data as
  | ChainInfo
  | undefined

export const useIBCChainInfo = (chainId: string) => {
  const { data, isLoading } = useQuery<ChainInfo>(
    '@chain-info',
    async () => {
      const response = await fetch('/chain_info.local' + chainId + '.json')
      return await response.json()
    },
    {
      onError(e) {
        console.error('Error loading chain info:', e)
      },
    }
  )
  return [data, isLoading] as const
}



export const useGetExpectedFlowFee = (
  durationSeconds: number,
  flowInput: FlowInput,
  denom: string,
  intervalSeconds?: number,
  trustlessAgent?: any // Add trustlessAgent parameter
) => {
  let [intentModuleParams, setTriggerModuleData] = useRecoilState(
    intentModuleParamsAtom
  )
  // Calculate recurrences based on interval and duration
  let recurrences =
    intervalSeconds && intervalSeconds > 0 && intervalSeconds < durationSeconds
      ? Math.floor(durationSeconds / intervalSeconds)
      : 1
  
  // Add extra recurrence if there's a startTime
  if (flowInput.startTime && flowInput.startTime > 0) {
    recurrences++
  }
  const client = useIntentoRpcClient()

  const stableQueryKey = useMemo(() => [
    'expectedFlowFee',
    recurrences,
    denom,
    flowInput.msgs?.length || 0,
    trustlessAgent?.address ?? null
  ], [recurrences, denom, flowInput.msgs, trustlessAgent?.address])

  const { data, isLoading } = useQuery(
    stableQueryKey,
    async () => {
      // Make sure client exists and has the intento property before proceeding
      if (!client || !client.intento) {
        console.warn('RPC client not ready or missing intento property')
        return { fee: 0, symbol: denom }
      }

      if (!intentModuleParams) {
        try {
          intentModuleParams = await getFlowParams(client)
          setTriggerModuleData(intentModuleParams)
        } catch (error) {
          console.error('Error getting flow params:', error)
          return { fee: 0, symbol: denom }
        }
      }

      // Validate inputs
      if (!flowInput.msgs || flowInput.msgs.length === 0) {
        console.warn('No messages in flowInput')
        return { fee: 0, symbol: denom }
      }



      try {
        // Ensure we have valid parameters before calling getExpectedFlowFee
        if (!intentModuleParams || !denom) {
          console.warn('Missing required parameters for fee calculation')
          return { fee: 0, symbol: denom }
        }

        // Get the actual denom to use based on the symbol
        // Always use denom_local from ibcAssetInfo if available

        //console.log('Using denom for fee calculation:', denom)

        // Log the denoms we're using
        console.log('Fee calculation:', {
          denom,
          recurrences,
          lenMsgs: flowInput.msgs.length,
          trustlessAgent
        })

        // First try with the actual denom (denom_local)
        let fee = getExpectedFlowFee(
          intentModuleParams,
          200000, // Default gas used
          flowInput.msgs.length,
          recurrences,
          denom,
          trustlessAgent // Pass hosted account for fee calculation
        )

        // Always calculate the fee in uinto for comparison
        const intoFee = getExpectedFlowFee(
          intentModuleParams,
          200000, // Default gas used
          flowInput.msgs.length,
          recurrences,
          'uinto', // Use the native token for comparison
          trustlessAgent // Pass hosted account for fee calculation
        )

        console.log(`Fee in denom: ${fee}, Fee in INTO: ${intoFee}`)

        // If fee is 0 but intoFee is not, it means the provided denom isn't supported
        // In this case, use the intoFee but keep the original symbol for display
        if (fee === 0 && intoFee > 0) {
          console.log(`No fee found for ${denom}, using INTO fee instead:`, intoFee)
          fee = intoFee
          denom = 'uinto'
        }

        // Hosted account fee is now handled in getExpectedFlowFee

        return { fee, denom }
      } catch (error) {
        console.error('Error calculating fee:', error)
        return { fee: 0, symbol: denom }
      }
    },
    {
      enabled: Boolean(durationSeconds && flowInput.msgs && flowInput.msgs.length > 0 && denom && client),
      refetchOnMount: true,
      staleTime: 10000, // Consider data stale after 10 seconds
      cacheTime: 30000, // Keep in cache for 30 seconds
      retry: 1, // Limit retries to avoid excessive error messages
      onError: (error) => {
        console.error('Error calculating expected fee:', error)
      }
    }
  )

  return [data?.fee || 0, isLoading, data?.symbol || denom] as const
}

export const useGetAllValidators = () => {
  const client = useCosmosRpcClient()

  const { data, isLoading } = useQuery(
    'getAllValidators',
    async () => {
      return client.cosmos.staking.v1beta1.validators({
        status: cosmos.staking.v1beta1.bondStatusToJSON(
          cosmos.staking.v1beta1.BondStatus.BOND_STATUS_BONDED
        ),
        pagination: undefined,
      })
    },
    {
      enabled: Boolean(client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}

export const useGetStakeBalanceForAcc = () => {
  const { address, status } = useRecoilValue(walletState)
  const client = useIntentoRpcClient()
  const { data, isLoading } = useQuery(
    'getStakeBalanceForAcc',
    async () => {
      const resp = await getStakeBalanceForAcc({ address, client })
      resp.stakingBalanceAmount = convertMicroDenomToDenom(
        resp.stakingBalanceAmount,
        6
      )

      return resp
    },
    {
      enabled: Boolean(
        client && address && status === WalletStatusType.connected
      ),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}

export const useGetAPR = () => {
  const cosmosClient = useCosmosRpcClient()
  const client = useTendermintRpcClient()
  const paramsState = useRecoilValue(paramsStateAtom)

  const { data, isLoading } = useQuery(
    'getAPR',
    async () => {
      const resp = await getAPR(cosmosClient, client, paramsState)
      return resp
    },
    {
      enabled: Boolean(client && paramsState),
      refetchOnMount: false,
      staleTime: 60000, // Cache data for 60 seconds
      cacheTime: 300000, // Cache data for 5 minutes
    }
  )

  return [data, isLoading] as const
}

export const useSetModuleParams = () => {
  const trstClient = useIntentoRpcClient()
  const cosmosClient = useCosmosRpcClient()
  const [paramsState, setParamsState] = useRecoilState(paramsStateAtom)

  const { data, isLoading } = useQuery(
    'getModuleParams',
    async () => {
      const resp = await getModuleParams(cosmosClient, trstClient)
      setParamsState(resp)
      return resp
    },
    {
      enabled: Boolean(cosmosClient && trstClient),
      refetchOnMount: 'always',
    }
  )
  useEffect(() => {
    if (paramsState) {
    }
  }, [paramsState])

  return [data, isLoading] as const
}

export const useGetAPYWithFees = (
  duration: number,
  interval: number,
  stakingBalance: number,
  nrMessages: number
) => {
  const [intentModuleParams, setTriggerModuleData] = useRecoilState(
    intentModuleParamsAtom
  )
  const paramsState = useRecoilValue(paramsStateAtom)

  const trstClient = useIntentoRpcClient()
  const { client } = useRecoilValue(walletState)

  // Use useAPR instead of getAPR
  const [APR, isLoadingAPR] = useGetAPR()

  const { data, isLoading } = useQuery(
    'useGetAPYWithFees',
    async () => {
      const intentModuleParams = await getFlowParams(trstClient)
      setTriggerModuleData(intentModuleParams)
      const recurrences =
        interval && interval < duration ? Math.floor(duration / interval) : 1

      // Calculate the APY percentage first (same as useGetAPY)
      const periodsPerYear = (60 * 60 * 24 * 365) / interval
      const baseAPY = ((1 + APR.estimatedApr / 100 / periodsPerYear) ** periodsPerYear - 1) * 100

      // Calculate fees for the entire period
      const expectedFees = getExpectedFlowFee(
        intentModuleParams,
        200000,
        nrMessages,
        recurrences,
        'uinto'
      )

      // Convert fees from micro units to INTO tokens
      const feesInINTO = convertMicroDenomToDenom(expectedFees, 6)

      // Calculate the effective APY by reducing the staking rewards by the fees
      // This is a simplified calculation - in reality, fees would be deducted periodically
      const feesAsPercentageOfStakingBalance = (feesInINTO / stakingBalance) * 100

      // Reduce the APY by the fee percentage
      return Math.max(0, baseAPY - feesAsPercentageOfStakingBalance)
    },
    {
      enabled: Boolean(client && APR && paramsState && stakingBalance > 0), // Ensure apr is available before executing
      refetchOnMount: false,
      staleTime: 60000, // Cache data for 60 seconds
      cacheTime: 300000, // Cache data for 5 minutes
    }
  )
  useEffect(() => {
    if (intentModuleParams && intentModuleParams.flowFlexFeeMul) {
    }
  }, [intentModuleParams])

  return [data, isLoading || isLoadingAPR] as const
}

export const useGetAPY = (intervalSeconds: number) => {
  const { client } = useRecoilValue(walletState)
  const paramsState = useRecoilValue(paramsStateAtom)

  // Use useAPR instead of getAPY
  const [APR, isLoadingAPR] = useGetAPR()

  const { data, isLoading } = useQuery(
    'useGetAPY',
    async () => {
      const periodsPerYear = (60 * 60 * 24 * 365) / intervalSeconds

      return (
        ((1 + APR.estimatedApr / 100 / periodsPerYear) ** periodsPerYear - 1) *
        100
      )
    },
    {
      enabled: Boolean(client && intervalSeconds > 0 && APR && paramsState),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading || isLoadingAPR] as const
}

export const useGetTotalSupply = () => {
  const client = useIntentoRpcClient()

  const { data, isLoading } = useQuery(
    'getTotalSupply',
    async () => {
      const { getTotalSupply } = await import('../services/chain-info')
      return getTotalSupply({ client })
    },
    {
      enabled: Boolean(client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}

export const useGetCommunityPool = () => {
  const client = useIntentoRpcClient()

  const { data, isLoading } = useQuery(
    'getCommunityPool',
    async () => {
      const { getCommunityPool } = await import('../services/chain-info')
      return getCommunityPool({ client })
    },
    {
      enabled: Boolean(client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}

export const useGetChainAndTeamWalletsBalance = () => {
  const client = useIntentoRpcClient()

  const { data, isLoading } = useQuery(
    'getChainAndTeamWalletsBalance',
    async () => {
      const { getChainAndTeamWalletsBalance } = await import('../services/chain-info')
      return getChainAndTeamWalletsBalance({ client })
    },
    {
      enabled: Boolean(client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}

export const useGetCirculatingSupply = () => {
  const [totalSupply, isTotalSupplyLoading] = useGetTotalSupply()
  const [communityPool, isCommunityPoolLoading] = useGetCommunityPool()
  const [chainAndTeamWallets, isChainAndTeamWalletsLoading] = useGetChainAndTeamWalletsBalance()

  const circulatingSupply = useMemo(() => {
    if (totalSupply && communityPool && chainAndTeamWallets) {
      return totalSupply - communityPool - chainAndTeamWallets
    }
    return null
  }, [totalSupply, communityPool, chainAndTeamWallets])

  const isLoading = isTotalSupplyLoading || isCommunityPoolLoading || isChainAndTeamWalletsLoading

  return [circulatingSupply, isLoading] as const
}

export const useGetAirdropClawback = () => {
  const client = useIntentoRpcClient()

  const { data, isLoading } = useQuery(
    'getAirdropClawback',
    async () => {
      if (!client) return { percentage: 0, amount: 0 }

      try {
        const initialModuleBalance = 89973272000000 // 89,973,272,000,000 in micro units
        const moduleAccAddress = 'into1m5dncvfv7lvpvycr23zja93fecun2kcvdnvuvq'

        const coin = await client.cosmos.bank.v1beta1.balance({
          address: moduleAccAddress,
          denom: 'uinto'
        })

        if (coin?.balance) {
          const diff = initialModuleBalance - Number(coin.balance.amount)
          const percentage = (diff / initialModuleBalance) * 100
          return {
            percentage: Number(percentage.toFixed(3)),
            amount: diff
          }
        }
        return { percentage: 0, amount: 0 }
      } catch (error) {
        console.error('Error fetching airdrop clawback:', error)
        return { percentage: 0, amount: 0 }
      }
    },
    {
      enabled: Boolean(client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}
