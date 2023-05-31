import { useQuery } from 'react-query'

import { trustlessChainClientRouter } from '../util/trustlessChainClientRouter'
import { useChainInfo } from './useChainInfo'

export const useTrustlessChainClient = () => {
  const [chainInfo] = useChainInfo()

  const { data } = useQuery(
    '@trustless-chain-client',
    () => trustlessChainClientRouter.connect(chainInfo.rpc, chainInfo.chainId),
    { enabled: Boolean(chainInfo?.rpc) }
  )

  return data
}
