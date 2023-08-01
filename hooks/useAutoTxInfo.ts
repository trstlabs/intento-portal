import { useQuery } from 'react-query'
// import { useRecoilValue } from 'recoil'
// import { getAutoTxInfo, getAutoTxInfos, /* getAutoTxInfosForOwner */ } from '../services/auto-ibc-tx'
// import { walletState } from '../state/atoms/walletAtoms'
import {
  DEFAULT_REFETCH_INTERVAL,
  AUTOTX_REFETCH_INTERVAL,
} from '../util/constants'
import { useTrstClient } from './useRPCClient'

export const useAutoTxInfos = () => {
  const client = useTrstClient()

  const { data, isLoading } = useQuery(
    'useAutoTxInfos',
    async () => {
      const resp = await client.trst.autoibctx.v1beta1.autoTxs({
        pagination: null,
      }) //getAutoTxInfos(client)

      console.log(resp)
      return resp.autoTxInfos
    },
    {
      enabled: Boolean(client),
      refetchOnMount: 'always',
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}

export const useAutoTxInfo = (id) => {
  const client = useTrstClient()
  const { data, isLoading } = useQuery(
    ['autoTxId', id],
    async () => {
      const info = await client.trst.autoibctx.v1beta1.autoTx({ id }) //getAutoTxInfo(id, client)
      //console.log(info)
      return info.autoTxInfo
    },
    {
      enabled: Boolean(id != '' || client),
      refetchOnMount: 'always',
      refetchInterval: AUTOTX_REFETCH_INTERVAL,
      refetchIntervalInBackground: true,
    }
  )

  return [data, isLoading] as const
}
