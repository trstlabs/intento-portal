import { useQuery } from 'react-query'

import {
  /*   DEFAULT_REFETCH_INTERVAL, */
  DEFAULT_LONG_REFETCH_INTERVAL,
} from '../util/constants'
import { useIntentoRpcClient } from './useRPCClient'
import { QueryFlowsResponse } from 'intentojs/dist/codegen/intento/intent/v1beta1/query'
import { GlobalDecoderRegistry } from 'intentojs'
import { PageRequest } from 'intentojs/dist/codegen/cosmos/base/query/v1beta1/pagination'

export const useFlowInfos = () => {
  const client = useIntentoRpcClient()

  const { data, isLoading } = useQuery(
    'useFlowInfos',
    async () => {
      const resp: QueryFlowsResponse =
        await client.intento.intent.v1beta1.flows({
          pagination: undefined,
        })

      // Transform each msg in flowInfos
      const transformedFlowInfos = resp.flowInfos.map((flowInfo) => {
        return {
          ...flowInfo,
          msgs: flowInfo.msgs.map((msg) => {
            //GlobalDecoderRegistry.unwrapAny(msg.value)
            const wrappedMsg = GlobalDecoderRegistry.wrapAny(msg)
            wrappedMsg.typeUrl =
              wrappedMsg.typeUrl ==
              '/cosmos.authz.v1beta1.QueryGranteeGrantsRequest'
                ? '/cosmos.authz.v1beta1.MsgExec'
                : wrappedMsg.typeUrl
            return {
              value: msg.value,
              valueDecoded: msg,
              typeUrl: msg.typeUrl || wrappedMsg.typeUrl,
            }
          }),
        }
      })

      return transformedFlowInfos
    },
    {
      enabled: Boolean(client && client.intento),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}

export const useFlowInfo = (id) => {
  const client = useIntentoRpcClient()
  const { data, isLoading } = useQuery(
    ['flowId', id],
    async () => {
      if (!id || !client || !client.intento) {
        throw new Error('Invalid ID or client not available')
      }
      const flowInfo = (await client.intento.intent.v1beta1.flow({ id }))
        .flowInfo
      return {
        ...flowInfo,
        msgs: flowInfo.msgs.map((msg) => {
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
      enabled: !!id && !!client?.intento,
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_LONG_REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
    }
  )

  return [data, isLoading] as const
}

export const useFlowHistory = (id, limit: number, key: Uint8Array) => {
  const client = useIntentoRpcClient()
  const { data, isLoading } = useQuery(
    `flowHistory/${id}/${key}`,
    async () => {
      if (!id || !client || !client.intento) {
        throw new Error('Invalid ID or client not available')
      }

      const pageRequest = PageRequest.fromPartial({
        limit: BigInt(limit),
        key,
        reverse: true,
        countTotal: true,
      })

      const flowHistoryResponse =
        await client.intento.intent.v1beta1.flowHistory({
          id: id,
          pagination: pageRequest,
        })
      return flowHistoryResponse
    },
    {
      enabled: !!id && !!client?.intento,
      refetchOnMount: false, // Prevent refetch on remount
      staleTime: 60000, // Cache data for 60 seconds
      cacheTime: 300000, // Cache data for 5 minutes
    }
  )

  return [data, isLoading] as const
}
