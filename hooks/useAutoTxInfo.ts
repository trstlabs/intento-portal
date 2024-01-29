import { useQuery } from 'react-query'

import {
  DEFAULT_REFETCH_INTERVAL,
  AUTOTX_REFETCH_INTERVAL,
} from '../util/constants'
import { useTrstRpcClient } from './useRPCClient'
import { QueryAutoTxsResponse } from 'trustlessjs/dist/codegen/trst/autoibctx/v1beta1/query'
import { GlobalDecoderRegistry } from 'trustlessjs'

export const useAutoTxInfos = () => {
  const client = useTrstRpcClient()

  const { data, isLoading } = useQuery(
    'useAutoTxInfos',
    async () => {
      const resp: QueryAutoTxsResponse =
        await client.trst.autoibctx.v1beta1.autoTxs({
          pagination: undefined,
        })

      // Transform each msg in autoTxInfos
      const transformedAutoTxInfos = resp.autoTxInfos.map((autoTxInfo) => {
        return {
          ...autoTxInfo,
          msgs: autoTxInfo.msgs.map((msg) => {
            const wrappedMsg = GlobalDecoderRegistry.wrapAny(msg)
            wrappedMsg.typeUrl =
              wrappedMsg.typeUrl ==
              '/cosmos.authz.v1beta1.QueryGranteeGrantsRequest'
                ? '/cosmos.authz.v1beta1.MsgExec'
                : wrappedMsg.typeUrl
            return {
              value: wrappedMsg.value,
              valueDecoded: msg,
              typeUrl: wrappedMsg.typeUrl,
            }
          }),
        }
      })

      return transformedAutoTxInfos
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
      if (!id || !client || !client.trst) {
        throw new Error('Invalid ID or client not available')
      }
      const autoTxInfo = (await client.trst.autoibctx.v1beta1.autoTx({ id }))
        .autoTxInfo
      return {
        ...autoTxInfo,
        msgs: autoTxInfo.msgs.map((msg) => {
          const wrappedMsg = GlobalDecoderRegistry.wrapAny(msg)
          wrappedMsg.typeUrl =
            wrappedMsg.typeUrl ==
            '/cosmos.authz.v1beta1.QueryGranteeGrantsRequest'
              ? '/cosmos.authz.v1beta1.MsgExec'
              : wrappedMsg.typeUrl
          return {
            value: wrappedMsg.value,
            valueDecoded: msg,
            typeUrl: wrappedMsg.typeUrl,
          }
        }),
      }
    },
    {
      enabled: !!id && !!client?.trst,
      refetchOnMount: 'always',
      refetchInterval: AUTOTX_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )
  console.log(data)
  return [data, isLoading] as const
}
