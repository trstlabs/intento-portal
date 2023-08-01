import { ChainInfo } from '@keplr-wallet/types'
import { useQuery } from 'react-query'

import { queryClient } from '../services/queryClient'
// import { Long } from 'trustlessjs/dist/codegen/helpers'
import { convertMicroDenomToDenom } from 'util/conversion'
import { cosmos } from 'trustlessjs'
import { DEFAULT_REFETCH_INTERVAL } from '../util/constants'

import { useTrstClient, useCosmosClient } from './useRPCClient'
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
import { AutoTxData } from '../services/ica'
import {
  paramsStateAtom,
  triggerModuleParamsAtom,
} from '../state/atoms/moduleParamsAtoms'
import { useEffect } from 'react'

const chainInfoQueryKey = '@chain-info'

export const unsafelyReadChainInfoCache = () =>
  queryClient.getQueryCache().find(chainInfoQueryKey)?.state?.data as
    | ChainInfo
    | undefined

export const useChainInfo = () => {
  const { data, isLoading } = useQuery<ChainInfo>(
    '@chain-info',
    async () => {
      const response = await fetch(process.env.NEXT_PUBLIC_CHAIN_INFO_URL)
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
  const client = useTrstClient()

  const { data, isLoading } = useQuery(
    'expectedAutoTxFee',
    async () => {
      const triggerModuleParams = getAutoTxParams(client)
      const fee = getExpectedAutoTxFee(
        triggerModuleParams,
        durationSeconds,
        autoTxData.msgs.length,
        intervalSeconds
      )
      setTriggerModuleData(triggerModuleParams)
      return fee
    },
    {
      enabled: Boolean(
        client && durationSeconds && autoTxData.msgs && isDialogShowing
      ),
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
  const client = useCosmosClient()

  const { data, isLoading } = useQuery(
    'getAllValidators',
    async () => {
      return client.cosmos.staking.v1beta1.validators({
        status: cosmos.staking.v1beta1.bondStatusToJSON(
          cosmos.staking.v1beta1.BondStatus.BOND_STATUS_BONDED
        ),
        pagination: null,
      })
    },
    {
      enabled: Boolean(client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    }
  )

  return [data, isLoading] as const
}

export const useGetStakeBalanceForAcc = () => {
  const { address, status } = useRecoilValue(walletState)
  const client = useTrstClient()
  const { data, isLoading } = useQuery(
    'useGetStakeBalanceForAcc',
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
  const client = useCosmosClient()
  const paramsState = useRecoilValue(paramsStateAtom)

  const { data, isLoading } = useQuery(
    'useGetAPR',
    async () => {
      const resp = await getAPR(client, paramsState)
      return resp
    },
    {
      enabled: Boolean(client && paramsState),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}

export const useSetModuleParams = () => {
  const trstClient = useTrstClient()
  const cosmosClient = useCosmosClient()
  const [paramsState, setParamsState] = useRecoilState(paramsStateAtom)

  const { data, isLoading } = useQuery(
    'useGetAPR',
    async () => {
      const resp = await getModuleParams(cosmosClient, trstClient)
      setParamsState(resp)
    },
    {
      enabled: Boolean(cosmosClient && trstClient),
      refetchIntervalInBackground: false,
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
  const client = useTrstClient()

  const { data, isLoading } = useQuery(
    'useGetAPYForCompound',
    async () => {
      const triggerModuleParams = await getAutoTxParams(client)
      setTriggerModuleData(triggerModuleParams)
      return getAPYForAutoCompound(
        triggerModuleParams,
        paramsState,
        client,
        duration,
        interval,
        stakingBalance,
        nrMessages
      )
    },
    {
      enabled: Boolean(client && paramsState),
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

export const useGetAPY = (intervalSeconds: number) => {
  const client = useTrstClient()
  const paramsState = useRecoilValue(paramsStateAtom)
  const { data, isLoading } = useQuery(
    'useGetAPY',
    async () => {
      const resp = await getAPY(client, paramsState, intervalSeconds)
      return resp
    },
    {
      enabled: Boolean(client && intervalSeconds > 0 && paramsState),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    }
  )

  return [data, isLoading] as const
}
