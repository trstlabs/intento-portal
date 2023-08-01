import { useChainInfo } from './useChainInfo'
import { trst } from 'trustlessjs'
import { cosmos } from 'trustlessjs'
// import { createRPCQueryClient as trstCreateRPCQueryClient } from 'trustlessjs/types/codegen/trst/rpc.query'
//import { createRPCQueryClient as cosmosCreateRPCQueryClient } from 'trustlessjs/types/codegen/cosmos/rpc.query'
import { useQuery } from 'react-query'
import { DEFAULT_REFETCH_INTERVAL } from '../util/constants'
// import { Query } from 'trustlessjs/types/codegen/trst/autoibctx/v1beta1/query.rpc.query'
// import { Tendermint34Client } from '@cosmjs/tendermint-rpc'
// import { QueryClient } from '@cosmjs/stargate'

export const useTrstClient = () => {
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

export const useCosmosClient = () => {
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
