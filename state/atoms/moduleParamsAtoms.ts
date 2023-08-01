import { atom } from 'recoil'
import { Params as TriggerModuleParams } from 'trustlessjs/types/codegen/trst/autoibctx/v1beta1/types'
import { Params as DistrModuleParams } from 'trustlessjs/types/codegen/cosmos/distribution/v1beta1/distribution'
import { Params as MintModuleParams } from 'trustlessjs/types/codegen/trst/mint/v1beta1/mint'
import { Params as AllocModuleParams } from 'trustlessjs/types/codegen/trst/alloc/v1beta1/params'
import { Params as StakingModuleParams } from 'trustlessjs/types/codegen/cosmos/staking/v1beta1/staking'

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
