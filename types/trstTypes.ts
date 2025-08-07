import { Coin } from '@cosmjs/stargate'
import {
  ExecutionConditions,
  ExecutionConfiguration,
  TrustlessAgentExecutionConfig,
} from 'intentojs/dist/codegen/intento/intent/v1/flow'


export class FlowInput {
  label?: string
  msgs: string[]
  duration: number
  interval?: number
  startTime?: number
  feeFunds?: Coin
  configuration?: ExecutionConfiguration
  conditions?: ExecutionConditions
  trustlessAgentExecutionConfig?: TrustlessAgentExecutionConfig
  icaAddressForAuthZ?: string
  connectionId?: string
  hostConnectionId?: string
  email?: string
  alertType?: string
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
  channel_to_intento?: string
  connection_id?: string
  counterparty_connection_id?: string
  prefix?: string
  denom_local?: string
}


export interface MsgUpdateFlowParams {
  owner: string
  id: number
  connectionId?: string
  msgs?: string[]
  endTime?: number
  label?: string
  interval?: number
  startAt?: number
  feeFunds?: Coin[]
  version?: string
  configuration?: ExecutionConfiguration
}