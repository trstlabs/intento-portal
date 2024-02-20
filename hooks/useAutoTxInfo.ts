import { useQuery } from 'react-query'

import {
/*   DEFAULT_REFETCH_INTERVAL, */
  DEFAULT_LONG_REFETCH_INTERVAL,
} from '../util/constants'
import { useTrstRpcClient } from './useRPCClient'
import { QueryAutoTxsResponse } from 'trustlessjs/dist/codegen/trst/autoibctx/v1beta1/query'
import { GlobalDecoderRegistry } from 'trustlessjs'
import { PageRequest } from 'trustlessjs/dist/codegen/cosmos/base/query/v1beta1/pagination'

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
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
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
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    }
  )

  return [data, isLoading] as const
}

export const useAutoTxHistory = (id, limit: number, key: Uint8Array) => {
  const client = useTrstRpcClient()
  const { data, isLoading } = useQuery(
    `autoTxHistory/${id}/${key}`,
    async () => {
      if (!id || !client || !client.trst) {
        throw new Error('Invalid ID or client not available')
      }

      const pageRequest = PageRequest.fromPartial({
        limit: BigInt(limit),
        key,
        reverse: true,
        countTotal: true,
      })
    
      const autoTxHistoryResponse = await client.trst.autoibctx.v1beta1.autoTxHistory({
        id: id,
        pagination: pageRequest,
      })
      return autoTxHistoryResponse
    },
    {
      enabled: !!id && !!client?.trst,
      refetchOnMount: true,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}
