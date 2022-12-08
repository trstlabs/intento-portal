import { TrustlessChainClient } from 'trustlessjs'

import { useGetTokenDollarValueQuery } from './useGetTokenDollarValueQuery'

export type InternalQueryContext = {
  client: TrustlessChainClient
  getTokenDollarValue: ReturnType<typeof useGetTokenDollarValueQuery>[0]
}
