import { useQuery } from 'react-query'
import { ContractInfoWithAddress, QueryContractsByCodeResponse } from 'trustlessjs'


import { getContractInfo, getContractInfos } from '../services/swap'
import { DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL } from '../util/constants'
import { useTrustlessChainClient } from './useTrustlessChainClient'



export const useContractInfo = (contract) => {
    const client = useTrustlessChainClient()
    const { data, isLoading } = useQuery(
        ['contract', contract],
        async () => {

            const infoObject = await getContractInfo(contract, client)
            console.log(infoObject.ContractInfo)
            return infoObject.ContractInfo
        },
        {
            //enabled: Boolean(contract == ''),
            refetchOnMount: 'always',
            refetchInterval: DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL,
            refetchIntervalInBackground: true,
        }
    )
    return [data, isLoading] as const
}


export const useContractInfos = (codeId: number) => {
    const client = useTrustlessChainClient()
    const { data, isLoading } = useQuery(
        ['codeId', codeId],
        async () => {
            const infoList = await getContractInfos(codeId, client)
            console.log(infoList)
            return infoList.contractInfos
        },
        {
            enabled: Boolean(codeId != 0),
            refetchOnMount: 'always',
            refetchInterval: DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL,
            refetchIntervalInBackground: true,
        },
    )
    if (!isLoading) {
        return [data, isLoading] as const
    } else {
        return [data, isLoading] as const
    }

}



export const useContractInfosMulti = (codeIds: Array<number>) => {
    const client = useTrustlessChainClient()
    let contracts: ContractInfoWithAddress[]
    const {  isLoading } = useQuery(
        ['codeIds', codeIds],
        async () => {
            for (let codeId of codeIds) {
                let infoList = await getContractInfos(codeId, client)
                contracts.concat(infoList.contractInfos)
                //return infoList.contractInfos
            }
        },
        {
            enabled: Boolean(codeIds.length != 0),
            refetchOnMount: 'always',
            refetchInterval: DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL,
            refetchIntervalInBackground: true,
        },
    )
    if (!isLoading) {
        return [contracts, isLoading] as const
    } else {
        return [contracts, isLoading] as const
    }

}
