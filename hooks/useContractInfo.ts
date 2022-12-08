import { useQuery } from 'react-query'

import { getContractInfo, getContractInfos } from '../services/swap'
import { DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL } from '../util/constants'
import { useTrustlessChainClient } from './useTrustlessChainClient'



export const useContractInfo = (contractAddress: string) => {
    const client = useTrustlessChainClient()
    const { data, isLoading } = useQuery(
        ['contractInfo', contractAddress],
        async () => {
            const infoObject = await getContractInfo(contractAddress, client)

            return infoObject
        },
        {
            enabled: Boolean(contractAddress != ''),
            refetchOnMount: 'always',
            refetchInterval: DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL,
            refetchIntervalInBackground: true,
        }
    )

    return [data, isLoading] as const
}


export const useContractInfos = (code: number) => {
    const client = useTrustlessChainClient()
    const { data, isLoading } = useQuery(
        ['code', code],
        async () => {
            const infoList = await getContractInfos(code, client)

            return infoList
        },
        {
            enabled: Boolean(code != 0),
            refetchOnMount: 'always',
            refetchInterval: DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL,
            refetchIntervalInBackground: true,
        }
    )

    return [data, isLoading] as const
}

