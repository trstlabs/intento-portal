import { useQuery } from 'react-query'

import {
  DEFAULT_REFETCH_INTERVAL,
  AUTOTX_REFETCH_INTERVAL,
} from '../util/constants'
import { useTrstRpcClient } from './useRPCClient'
import { QueryAutoTxsResponse } from 'trustlessjs/dist/codegen/trst/autoibctx/v1beta1/query'

export const useAutoTxInfos = () => {
  const client = useTrstRpcClient()

  const { data, isLoading } = useQuery(
    'useAutoTxInfos',
    async () => {
      const resp: QueryAutoTxsResponse =
        await client.trst.autoibctx.v1beta1.autoTxs({
          pagination: undefined,
        })
            return resp.autoTxInfos
    },
    {
      enabled: Boolean(client && client.trst),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}

export const useAutoTxInfo = (id) => {
  const client = useTrstRpcClient()
  const { data, isLoading } = useQuery(
    ['autoTxId', id],
    async () => {
      const info = await client.trst.autoibctx.v1beta1.autoTx({ id })
      //console.log(info)
      return info.autoTxInfo
    },
    {
      enabled: Boolean(id != '' || (client && client.trst)),
      refetchOnMount: 'always',
      refetchInterval: AUTOTX_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}
