import { Any } from 'cosmjs-types/google/protobuf/any'
import { Coin } from '@cosmjs/stargate'
import { ExecutionConfiguration, /* AutoTxHistoryEntry */ } from 'trustlessjs/dist/codegen/trst/autoibctx/v1beta1/types'

export interface MsgUpdateAutoTxParams {
  owner: string
  txId: number
  connectionId?: string
  msgs?: Any[]
  endTime?: number
  label?: string
  interval?: string
  startAt?: number
  feeFunds?: Coin[]
  version?: string
  configuration?: ExecutionConfiguration
}

export class AutoTxData {
  duration: number
  msgs: string[]
  icaAddressForAuthZGrant?: string
  recurrences: number
  startTime?: number
  interval?: number
  connectionId?: string
  configuration?: ExecutionConfiguration
  feeFunds?: number
  label?: string
}


export type SelectChainInfo = {
  id: string
  chain_id: string
  symbol: string
  name: string
  decimals: number
  logo_uri: string
  denom: string
  channel?: string
  channel_to_trst?: string
  connection_id?: string
  counterparty_connection_id?: string
  prefix?: string
  denom_on_trst?: string
}
