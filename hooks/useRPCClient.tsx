import { trst, cosmos, tendermint } from 'trustlessjs'

import { useQuery } from 'react-query'

import { StargateClient } from '@cosmjs/stargate'

export const useTrstRpcClient = () => {
  const { data } = useQuery(
    '@trst-querier',
    async () => {
      return trst.ClientFactory.createRPCQueryClient({
        rpcEndpoint: process.env.NEXT_PUBLIC_TRST_RPC,
      })
    },
    { enabled: true}
  )

  return data
}

export const useCosmosRpcClient = () => {
  const { data } = useQuery(
    '@cosmos-querier',
    () => {
      return cosmos.ClientFactory.createRPCQueryClient({
       rpcEndpoint: process.env.NEXT_PUBLIC_TRST_RPC,
      })
    },
    { enabled: cosmos != undefined}
  )

  return data
}



export const useTMRpcClient = () => {
  const { data } = useQuery(
    '@client-querier',
    () => {
      return StargateClient.connect(
       process.env.NEXT_PUBLIC_TRST_RPC,
      )
    },
    { enabled: tendermint != undefined}
  )

  return data
}

