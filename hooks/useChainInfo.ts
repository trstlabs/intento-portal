import { ChainInfo } from '@keplr-wallet/types'
import { useQuery } from 'react-query'
import { queryClient } from '../services/queryClient'

import { convertMicroDenomToDenom } from 'util/conversion'
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
import {
  getStakeBalanceForAcc,
  getAPR,
  getExpectedFlowFee,
  getFlowParams,
  getModuleParams,
} from '../services/chain-info'
import { useRecoilState, useRecoilValue } from 'recoil'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'

import {
  paramsStateAtom,
  intentModuleParamsAtom,
} from '../state/atoms/moduleParamsAtoms'
import { useEffect } from 'react'
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
  isDialogShowing: boolean,
  denom: string,
  intervalSeconds?: number
) => {
  let [intentModuleParams, setTriggerModuleData] = useRecoilState(
    intentModuleParamsAtom
  )

  const client = useIntentoRpcClient()


  const { data, isLoading } = useQuery(
    `expectedFlowFee/${durationSeconds}/${intervalSeconds}/${denom}`,
    async () => {

      if (intentModuleParams == undefined) {
        intentModuleParams = await getFlowParams(client)
        setTriggerModuleData(intentModuleParams)
      }
      const recurrences =
        intervalSeconds && intervalSeconds < durationSeconds
          ? Math.floor(durationSeconds / intervalSeconds)
          : 1
      const fee = getExpectedFlowFee(
        intentModuleParams,
        200000,
        flowInput.msgs.length,
        recurrences,
        denom
      )
      console.log(fee)
      return fee
    },
    {
      enabled: Boolean(durationSeconds && flowInput.msgs && isDialogShowing && denom),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )
  
  return [data, isLoading] as const
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
      // Use apr value from useAPR instead of calling getAPYForAutoCompound directly
      const expectedFees = getExpectedFlowFee(
        intentModuleParams,
        200000,
        nrMessages,
        recurrences,
        'uinto'
      )
      return (
        (APR.calculatedApr * stakingBalance) / stakingBalance - expectedFees
      )
    },
    {
      enabled: Boolean(client && APR && paramsState), // Ensure apr is available before executing
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
