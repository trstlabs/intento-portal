import { ChainInfo } from '@keplr-wallet/types'
import { useQuery } from 'react-query'

import { queryClient } from '../services/queryClient'

import { convertMicroDenomToDenom } from 'util/conversion'

import { DEFAULT_REFETCH_INTERVAL } from '../util/constants'


import { useTrustlessChainClient } from './useTrustlessChainClient'
import { getStakeBalanceForAcc, getValidators, getAPR, getAPY, getExpectedAutoTxFee } from '../services/chain-info'
import { useRecoilValue } from 'recoil'
import { walletState, WalletStatusType } from '../state/atoms/walletAtoms'
import { AutoTxData } from '../services/ica'



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

export const useGetExpectedAutoTxFee = (durationSeconds: number, autoTxData: AutoTxData, intervalSeconds?: number) => {
  const client = useTrustlessChainClient()
  const { data, isLoading } = useQuery(
    'useGetExpectedAutoTxFee',
    async () => {
      const expectedAutoTxFee = await getExpectedAutoTxFee(client, durationSeconds, autoTxData.msgs.length, intervalSeconds)

      return expectedAutoTxFee
    },
    {
      enabled: Boolean(client && durationSeconds && autoTxData.msgs),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    },
  )
  return [data, isLoading] as const
}


export const useGetAllValidators = () => {
  const client = useTrustlessChainClient()

  const { data, isLoading } = useQuery(
    'useGetAllValidators',
    async () => {

      return await getValidators({ client })

    },
    {
      enabled: Boolean(client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  )

  return [data, isLoading] as const
}

export const useGetRandomValidator = () => {
  const client = useTrustlessChainClient()

  const { data, isLoading } = useQuery(
    'useGetRandomValidator',
    async () => {
      const validators = await getValidators({ client })
      const value = Math.random() * (validators.length - 1);
      return validators[value]
    },
    {
      enabled: Boolean(client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  )

  return [data, isLoading] as const
}


export const useGetStakeBalanceForAcc = () => {
  const { client, address, status } = useRecoilValue(walletState)

  const { data, isLoading } = useQuery(
    "useGetStakeBalanceForAcc",
    async () => {

      const resp = await getStakeBalanceForAcc({ address, client })
      resp.stakingBalanceAmount = convertMicroDenomToDenom(resp.stakingBalanceAmount, 6)

      return resp
    },
    {
      enabled: Boolean(client && address && status === WalletStatusType.connected),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    },
  )

  return [data, isLoading] as const
}

export const useGetAPR = () => {
  const client = useTrustlessChainClient()

  const { data, isLoading } = useQuery(
    "useGetAPR",
    async () => {

      const resp = await getAPR(client)
      return resp

    },
    {
      enabled: Boolean(client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    },
  )

  return [data, isLoading] as const
}


export const useGetAPY = (intervalSeconds: number) => {
  const client = useTrustlessChainClient()

  const { data, isLoading } = useQuery(
    "useGetAPY",
    async () => {
      const resp = await getAPY(client, intervalSeconds)
      return resp
    },
    {
      enabled: Boolean(client && intervalSeconds > 0),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    },
  )

  return [data, isLoading] as const
}
