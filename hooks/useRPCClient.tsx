import { useChainInfo } from './useChainInfo'
import { trst } from 'trustlessjs'
import { cosmos } from 'trustlessjs'
import { useQuery } from 'react-query'


export const useTrstRpcClient = () => {
  const [chainInfo] = useChainInfo()

  const { data } = useQuery(
    '@trst-querier',
    async () => {
      return trst.ClientFactory.createRPCQueryClient({
        rpcEndpoint: chainInfo.rpc,
      })
    },
    { enabled: Boolean(chainInfo?.rpc) }
  )

  return data
}

export const useCosmosRpcClient = () => {
  const [chainInfo] = useChainInfo()

  const { data } = useQuery(
    '@cosmos-querier',
    () => {
      return cosmos.ClientFactory.createRPCQueryClient({
        rpcEndpoint: chainInfo.rpc,
      })
    },
    { enabled: Boolean(chainInfo?.rpc) }
  )

  return data
}



// export const useCosmosRpcClient = () => {
//   const [chainInfo] = useChainInfo()

//   const { data } = useQuery(
//     '@cosmos-querier',
//     () => {
//       return tendermint.abci..ClientFactory.createRPCQueryClient({
//         rpcEndpoint: chainInfo.rpc,
//       })
//     },
//     { enabled: Boolean(chainInfo?.rpc) }
//   )

//   return data
// }
