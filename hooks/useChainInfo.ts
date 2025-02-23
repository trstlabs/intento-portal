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
  getAPY,
  getExpectedFlowFee,
  getAPYForAutoCompound,
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
  intervalSeconds?: number
) => {
  const [intentModuleParams, setTriggerModuleData] = useRecoilState(
    intentModuleParamsAtom
  )
  const client = useIntentoRpcClient()
  const { data, isLoading } = useQuery(
    `expectedFlowFee/${durationSeconds}/${intervalSeconds}`,
    async () => {
      const intentModuleParams = await getFlowParams(client)
      setTriggerModuleData(intentModuleParams)
      const fee = getExpectedFlowFee(
        intentModuleParams,
        200000,
        durationSeconds,
        flowInput.msgs.length,
        intervalSeconds
      )

      return fee
    },
    {
      enabled: Boolean(durationSeconds && flowInput.msgs && isDialogShowing),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )
  useEffect(() => {
    if (intentModuleParams && intentModuleParams.flowFlexFeeMul) {
    }
  }, [intentModuleParams])

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
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
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

export const useGetAPYForWithFees = (
  duration: number,
  interval: number,
  stakingBalance: number,
  nrMessages: number
) => {
  const [intentModuleParams, setTriggerModuleData] = useRecoilState(
    intentModuleParamsAtom
  )
  const paramsState = useRecoilValue(paramsStateAtom)
  const cosmosClient = useCosmosRpcClient()
  const trstClient = useIntentoRpcClient()
  const { client } = useRecoilValue(walletState)

  const { data, isLoading } = useQuery(
    'useGetAPYForWithFees',
    async () => {
      const intentModuleParams = await getFlowParams(trstClient)
      setTriggerModuleData(intentModuleParams)

      return getAPYForAutoCompound(
        intentModuleParams,
        paramsState,
        cosmosClient,
        client,
        duration,
        interval,
        stakingBalance,
        nrMessages
      )
    },
    {
      enabled: Boolean(
        !!client && !!cosmosClient && !!trstClient && !!paramsState
      ),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  useEffect(() => {
    if (intentModuleParams && intentModuleParams.flowFlexFeeMul) {
    }
  }, [intentModuleParams])

  return [data, isLoading] as const
}

export const useGetAPY = (intervalSeconds: number) => {
  const cosmosClient = useCosmosRpcClient()
  const { client } = useRecoilValue(walletState)
  const paramsState = useRecoilValue(paramsStateAtom)
  const { data, isLoading } = useQuery(
    'useGetAPY',
    async () => {
      const resp = await getAPY(
        cosmosClient,
        client,
        paramsState,
        intervalSeconds
      )
      return resp
    },
    {
      enabled: Boolean(client && intervalSeconds > 0 && paramsState),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}
