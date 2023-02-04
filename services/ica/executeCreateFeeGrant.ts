import { SigningStargateClient, assertIsDeliverTxSuccess } from '@cosmjs/stargate'

import { BasicAllowance } from 'trustlessjs/dist/protobuf/cosmos/feegrant/v1beta1/feegrant'

import { MsgGrantAllowance } from 'trustlessjs/dist/tx/feegrant'

import { isTxBodyEncodeObject } from '@cosmjs/proto-signing'

type ExecuteCreateFeeGrantArgs = {
  granter: string
  grantee: string
  allowance: BasicAllowance
  client: SigningStargateClient
}

export const executeCreateFeeGrant = async ({
  client,
  grantee,
  granter,
  allowance,
}: ExecuteCreateFeeGrantArgs): Promise<any> => {
  console.log(grantee)
  console.log(granter)
  let msgFeeGrant = new MsgGrantAllowance({
    grantee, granter, allowance
  })
  isTxBodyEncodeObject
  const MsgGrantAllowanceObject = {
    typeUrl: "/cosmos.feegrant.v1beta1.MsgGrantAllowance",
    value: msgFeeGrant,
  }
  // let converters = createFeegrantAminoConverters()
  // let aminoMsg = await msgFeeGrant.toProto()
  let response = await client.signAndBroadcast(granter, [MsgGrantAllowanceObject], "auto");
  console.log(response)

  return assertIsDeliverTxSuccess(response)
}
