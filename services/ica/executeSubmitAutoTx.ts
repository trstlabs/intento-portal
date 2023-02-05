import {
  // GeneratedType,
  // getMsgDecoderRegistry,
  msgRegistry, Registry,
  TrustlessChainClient,
} from 'trustlessjs'

import {

  validateTransactionSuccess,
} from '../../util/messages'

// import { Any } from 'trustlessjs/dist/protobuf/google/protobuf/any'
// //import { encodeAsAny } from '@cosmjs/proto-signing/build/registry'
// import { MsgExec } from 'trustlessjs/dist/protobuf/cosmos/authz/v1beta1/tx'
// import { MsgDelegate } from 'trustlessjs/dist/protobuf/cosmos/staking/v1beta1/tx'
// import { MsgDelegateEncodeObject, SigningStargateClient } from '@cosmjs/stargate'
// import { EncodeObject } from '@cosmjs/proto-signing'
// import { Coin } from 'trustlessjs/dist/protobuf/cosmos/base/v1beta1/coin'
//import { MsgDelegate } from '@cosmjs/launchpad'



type ExecuteSubmitAutoTxArgs = {
  owner: string
  autoTxData: AutoTxData
  client: TrustlessChainClient
}

export const executeSubmitAutoTx = async ({
  client,
  autoTxData,
  owner,
}: ExecuteSubmitAutoTxArgs): Promise<any> => {


  let startAt = 0

  if (autoTxData.startTime != 0) {
    startAt = (Math.floor(Date.now() / 1000) + autoTxData.startTime / 1000);
  }
  console.log(startAt)
  console.log(autoTxData.withAuthZ)
  console.log(JSON.parse(autoTxData.msg))

  let duration = autoTxData.duration + "ms"
  let interval = autoTxData.interval + "ms"
  const masterRegistry = new Registry(msgRegistry);

  //let type = masterRegistry.lookupType((JSON.parse(autoTxData.msg)["typeUrl"]).toString())
  let value = JSON.parse(autoTxData.msg)["value"]
  console.log(value)
  const encodeObject = {
    typeUrl: JSON.parse(autoTxData.msg)["typeUrl"].toString(),
    value
  }
  //console.log(type)
  console.log(encodeObject)
  let msg = masterRegistry.encodeAsAny(encodeObject)
  console.log(msg)
  if (autoTxData.withAuthZ) {
    const encodeObject2 = {
      typeUrl: "/cosmos.authz.v1beta1.MsgExec",
      value: {
        msgs: [msg],
        grantee: owner,
      }
     
    }
     msg = masterRegistry.encodeAsAny(encodeObject2)
     console.log(msg)

  }

  console.log(msg.value.toString())
  return validateTransactionSuccess(
    await client.tx.autoibctx.submit_auto_tx({
      connectionId: autoTxData.connectionId, owner,
      msg: msg,
      duration,
      interval,
      startAt: startAt.toString(),
      // retries: 0,//autoTxData.retries,
      // dependsOnTxIds,
      // feeFunds,
    },

      { gasLimit: Number(process.env.NEXT_PUBLIC_GAS_LIMIT_MORE) }
    )
  )

}


export class AutoTxData {
  duration: number
  startTime?: number
  interval?: number
  connectionId: string
  dependsOnTxIds: number[]
  msg: string
  retries: number
  withAuthZ: boolean
}
/* 
const atob: (b64: string) => string =
  globalThis.atob ||
  ((b64) => globalThis.Buffer.from(b64, "base64").toString("binary"));
function bytesFromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; ++i) {
    arr[i] = bin.charCodeAt(i);
  }
  return arr;
}




 */