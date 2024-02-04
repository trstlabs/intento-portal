import { ChainInfo } from '@keplr-wallet/types'
import { useQuery } from 'react-query'
import { queryClient } from '../services/queryClient'

import { convertMicroDenomToDenom } from 'util/conversion'
import { cosmos } from 'trustlessjs'
import {
  DEFAULT_REFETCH_INTERVAL,
  DEFAULT_LONG_REFETCH_INTERVAL,
} from '../util/constants'

import {
  useTrstRpcClient,
  useCosmosRpcClient,
  useTendermintRpcClient,
} from './useRPCClient'
import {
  getStakeBalanceForAcc,
  getAPR,
  getAPY,
  getExpectedAutoTxFee,
  getAPYForAutoCompound,
  getAutoTxParams,
  getModuleParams,
} from '../services/chain-info'
import { useRecoilState, useRecoilValue } from 'recoil'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'

import {
  paramsStateAtom,
  triggerModuleParamsAtom,
} from '../state/atoms/moduleParamsAtoms'
import { useEffect } from 'react'
import { AutoTxData } from '../types/trstTypes'

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

export const useGetExpectedAutoTxFee = (
  durationSeconds: number,
  autoTxData: AutoTxData,
  isDialogShowing: boolean,
  intervalSeconds?: number
) => {
  const [triggerModuleParams, setTriggerModuleData] = useRecoilState(
    triggerModuleParamsAtom
  )
  const client = useTrstRpcClient()
  const { data, isLoading } = useQuery(
    `expectedAutoTxFee/${durationSeconds}/${intervalSeconds}`,
    async () => {
      const triggerModuleParams = await getAutoTxParams(client)
      setTriggerModuleData(triggerModuleParams)
      const fee = getExpectedAutoTxFee(
        triggerModuleParams,
        durationSeconds,
        autoTxData.msgs.length,
        intervalSeconds
      )

      return fee
    },
    {
      enabled: Boolean(durationSeconds && autoTxData.msgs && isDialogShowing),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )
  useEffect(() => {
    if (triggerModuleParams && triggerModuleParams.AutoTxFlexFeeMul) {
    }
  }, [triggerModuleParams])

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
  const client = useTrstRpcClient()
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
  const trstClient = useTrstRpcClient()
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
  const [triggerModuleParams, setTriggerModuleData] = useRecoilState(
    triggerModuleParamsAtom
  )
  const paramsState = useRecoilValue(paramsStateAtom)
  const cosmosClient = useCosmosRpcClient()
  const trstClient = useTrstRpcClient()
  const { client } = useRecoilValue(walletState)

  const { data, isLoading } = useQuery(
    'useGetAPYForWithFees',
    async () => {
      const triggerModuleParams = await getAutoTxParams(trstClient)
      setTriggerModuleData(triggerModuleParams)

      return getAPYForAutoCompound(
        triggerModuleParams,
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
    if (triggerModuleParams && triggerModuleParams.AutoTxFlexFeeMul) {
    }
  }, [triggerModuleParams])

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
