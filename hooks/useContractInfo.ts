export {} 
// import { useQuery } from 'react-query'
// import { getContractInfo, getContractInfos } from '../services/contracts'
// import { DEFAULT_REFETCH_INTERVAL } from '../util/constants'
// import { useTrstRpcClient } from './useRPCClient'



// export const useContractInfo = (contract) => {
//     const client = useTrstRpcClient()
//     const { data, isLoading } = useQuery(
//         ['contract', contract],
//         async () => {

//             const infoObject = await getContractInfo(contract, client)
//             console.log(infoObject.ContractInfo)
//             return infoObject.ContractInfo
//         },
//         {
//             enabled: Boolean(client && contract),
//             refetchOnMount: 'always',
//             refetchInterval: DEFAULT_REFETCH_INTERVAL,
//             refetchIntervalInBackground: true,
//         }
//     )
//     return [data, isLoading] as const
// }


// export const useContractInfos = (codeId: number) => {
//     const client = useTrstRpcClient()
//     const { data, isLoading } = useQuery(
//         ['codeId', codeId],
//         async () => {
//             const infoList = await getContractInfos(codeId, client)
//             console.log(infoList)
//             return infoList.contractInfos
//         },
//         {
//             enabled: Boolean(codeId != 0 && client),
//             refetchOnMount: 'always',
//             refetchInterval: DEFAULT_REFETCH_INTERVAL,
//             refetchIntervalInBackground: true,
//         },
//     )

//     return [data, isLoading] as const


// }



// export const useContractInfosMulti = (codeIds: Array<number>) => {
//     const client = useTrstRpcClient()

//     const { data, isLoading } = useQuery(
//         ['codeIds', codeIds],
//         async () => {
//             let contracts = []
//             for (let codeId of codeIds) {
//                 let infoList = await getContractInfos(codeId, client)
//                 if (infoList) {
//                     contracts = contracts.concat(infoList.contractInfos)
                    
//                 }
//             }
//             console.log(contracts)
//             return contracts
//         },
//         {
//             enabled: Boolean(codeIds[0] != 0 && client),
//             refetchOnMount: 'always',
//             refetchInterval: DEFAULT_REFETCH_INTERVAL,
//             refetchIntervalInBackground: false,
//         },
//     )
//     console.log(data)
//     return [data, isLoading] as const


// }
