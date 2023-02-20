import { useQuery } from 'react-query'

import { convertMicroDenomToDenom } from 'util/conversion'

import { DEFAULT_REFETCH_INTERVAL } from '../util/constants'


import { useTrustlessChainClient } from './useTrustlessChainClient'
import { getStakeBalanceForAcc, getValidators, getAPR, getAPY } from '../services/chain-info'


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
  const client = useTrustlessChainClient()

  const { data, isLoading } = useQuery(
    ['address', client.address],
    async () => {

      const resp = await getStakeBalanceForAcc({ address: client.address, client })
      return convertMicroDenomToDenom(resp.stakingBalanceAmount, 6), resp.nrValidators
    },
    {
      enabled: Boolean(client && client.address),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
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
