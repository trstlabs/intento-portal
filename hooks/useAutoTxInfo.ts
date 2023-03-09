import { useQuery } from 'react-query'
// import { useRecoilValue } from 'recoil'
import { getAutoTxInfo, getAutoTxInfos, getAutoTxInfosForOwner } from '../services/auto-ibc-tx'
// import { walletState } from '../state/atoms/walletAtoms'
import { DEFAULT_REFETCH_INTERVAL, AUTOTX_REFETCH_INTERVAL } from '../util/constants'
import { useTrustlessChainClient } from './useTrustlessChainClient'

export const useAutoTxInfosForOwner = () => {
    const client = useTrustlessChainClient()
    const { data, isLoading } = useQuery(
        ['autoTxForOwner', client.address],
        async () => {

            const infoObject = await getAutoTxInfosForOwner(client.address, client)

            return infoObject
        },
        {
            enabled: Boolean(client),
            refetchOnMount: 'always',
            refetchInterval: DEFAULT_REFETCH_INTERVAL,
            refetchIntervalInBackground: true,
        }
    )
    return [data, isLoading] as const
}

export const useAutoTxInfos = () => {
    const client = useTrustlessChainClient()

    const { data, isLoading } = useQuery(
        'useAutoTxInfos',
        async () => {

            const resp = await getAutoTxInfos(client)

            console.log(resp)
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


export const useAutoTxInfo = (id) => {
    const client = useTrustlessChainClient()
    const { data, isLoading } = useQuery(
        ['autoTxId', id],
        async () => {
           
            const info = await getAutoTxInfo(id, client)
            console.log(info)
            return info.autoTxInfo
        },
        {
            enabled: Boolean(id != "" || client),
            refetchOnMount: 'always',
            refetchInterval: AUTOTX_REFETCH_INTERVAL,
            refetchIntervalInBackground: true,
        },
    )

    return [data, isLoading] as const


}

