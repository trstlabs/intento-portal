import { atom } from 'recoil'
import { Params as IntentModuleParams } from 'intentojs/dist/codegen/intento/intent/v1beta1/params'
import { Params as DistrModuleParams } from 'intentojs/dist/codegen/cosmos/distribution/v1beta1/distribution'
import { Params as MintModuleParams } from 'intentojs/dist/codegen/intento/mint/v1beta1/mint'
import { Params as AllocModuleParams } from 'intentojs/dist/codegen/intento/alloc/v1beta1/params'
import { Params as StakingModuleParams } from 'intentojs/dist/codegen/cosmos/staking/v1beta1/staking'

// Define an atom state for the session data
export const intentModuleParamsAtom = atom<IntentModuleParams>({
  key: 'intentModuleParams',
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
