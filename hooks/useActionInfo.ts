import { useQuery } from 'react-query'

import {
/*   DEFAULT_REFETCH_INTERVAL, */
  DEFAULT_LONG_REFETCH_INTERVAL,
} from '../util/constants'
import { useIntentoRpcClient } from './useRPCClient'
import { QueryActionsResponse } from 'intentojs/dist/codegen/intento/intent/v1beta1/query'
import { GlobalDecoderRegistry } from 'intentojs'
import { PageRequest } from 'intentojs/dist/codegen/cosmos/base/query/v1beta1/pagination'

export const useActionInfos = () => {
  const client = useIntentoRpcClient()

  const { data, isLoading } = useQuery(
    'useActionInfos',
    async () => {
      const resp: QueryActionsResponse =
        await client.intento.intent.v1beta1.actions({
          pagination: undefined,
        })

      // Transform each msg in actionInfos
      const transformedActionInfos = resp.actionInfos.map((actionInfo) => {
        return {
          ...actionInfo,
          msgs: actionInfo.msgs.map((msg) => {
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

      return transformedActionInfos
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

export const useActionInfo = (id) => {
  const client = useIntentoRpcClient()
  const { data, isLoading } = useQuery(
    ['actionId', id],
    async () => {
      if (!id || !client || !client.intento) {
        throw new Error('Invalid ID or client not available')
      }
      const actionInfo = (await client.intento.intent.v1beta1.action({ id }))
        .actionInfo
      return {
        ...actionInfo,
        msgs: actionInfo.msgs.map((msg) => {
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

export const useActionHistory = (id, limit: number, key: Uint8Array) => {
  const client = useIntentoRpcClient()
  const { data, isLoading } = useQuery(
    `actionHistory/${id}/${key}`,
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
    
      const actionHistoryResponse = await client.intento.intent.v1beta1.actionHistory({
        id: id,
        pagination: pageRequest,
      })
      return actionHistoryResponse
    },
    {
      enabled: !!id && !!client?.intento,
      refetchOnMount: true,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}
