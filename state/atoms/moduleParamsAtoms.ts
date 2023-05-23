import { atom } from 'recoil'
import { Params as triggerModuleParams } from 'trustlessjs/dist/protobuf/auto-ibc-tx/v1beta1/types';
import { Params as distrModuleParams } from 'trustlessjs/dist/protobuf/cosmos/distribution/v1beta1/distribution';
import { Params as mintModuleParams } from 'trustlessjs/dist/protobuf/mint/v1beta1/mint';
// import { Params as allocModuleParams } from 'trustlessjs/dist/protobuf/alloc/v1beta1/params';
// import { Params as stakingModuleParams } from 'trustlessjs/dist/protobuf/cosmos/staking/v1beta1/staking';




// Define an atom state for the session data
export const triggerModuleParamsAtom = atom<triggerModuleParams>({
  key: 'triggerModuleParams',
  default: null,
});

export type ParamsState = {
  distrModuleParams:distrModuleParams
  mintModuleParams: mintModuleParams
  //allocModuleParams: allocModuleParams
  annualProvision: Uint8Array
  stakingProvision: number
  communityTax: string

}

export const paramsStateAtom = atom<ParamsState>({
  key: 'paramsStateAtom',
  default: null,
});

