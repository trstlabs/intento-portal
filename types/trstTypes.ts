import { Any } from 'cosmjs-types/google/protobuf/any'
import { Coin } from '@cosmjs/stargate'
import {
  ExecutionConditions,
  ExecutionConfiguration,
  HostedConfig,
} from 'intentojs/dist/codegen/intento/intent/v1beta1/action'

export interface MsgUpdateActionParams {
  owner: string
  id: number
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

export class ActionInput {
  label?: string
  msgs: string[]
  duration: number
  interval?: number
  startTime?: number
  feeFunds?: number
  configuration?: ExecutionConfiguration
  conditions?: ExecutionConditions
  hostedConfig?: HostedConfig
  icaAddressForAuthZ?: string
  connectionId?: string
  hostConnectionId?: string
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
