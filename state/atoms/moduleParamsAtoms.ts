import { atom } from 'recoil'
import { Params as TriggerModuleParams } from 'trustlessjs/dist/codegen/trst/autoibctx/v1beta1/types'
import { Params as DistrModuleParams } from 'trustlessjs/dist/codegen/cosmos/distribution/v1beta1/distribution'
import { Params as MintModuleParams } from 'trustlessjs/dist/codegen/trst/mint/v1beta1/mint'
import { Params as AllocModuleParams } from 'trustlessjs/dist/codegen/trst/alloc/v1beta1/params'
import { Params as StakingModuleParams } from 'trustlessjs/dist/codegen/cosmos/staking/v1beta1/staking'

// Define an atom state for the session data
export const triggerModuleParamsAtom = atom<TriggerModuleParams>({
  key: 'triggerModuleParams',
  default: null,
})

export type ParamsState = {
  distrModuleParams: DistrModuleParams
  mintModuleParams: MintModuleParams
  allocModuleParams: AllocModuleParams
  stakingModuleParams: StakingModuleParams
  annualProvision: string
  stakingProvision: number
}

export const paramsStateAtom = atom<ParamsState>({
  key: 'paramsStateAtom',
  default: null,
})
