import { convertDenomToMicroDenom } from 'junoblocks'
import {
  Coin,
  // GeneratedType,
  // getMsgDecoderRegistry,
  msgRegistry, Registry,
  toUtf8,
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
  let interval = "100000ms"//autoTxData.interval + "ms"

  const masterRegistry = new Registry(msgRegistry);

  //let type = masterRegistry.lookupType((JSON.parse(autoTxData.msg)["typeUrl"]).toString())
  let value = JSON.parse(autoTxData.msg)["value"]
  console.log(value)

  let typeUrl: string = JSON.parse(autoTxData.msg)["typeUrl"].toString()
  if (typeUrl.startsWith("/cosmwasm")) {
    let msg: string = JSON.stringify(value["msg"])
    console.log(msg)
    let msg2: Uint8Array = toUtf8(msg)
    console.log(msg2)
    value["msg"] = msg2
  }

  const encodeObject = {
    typeUrl,
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
  let feeFunds: Coin[] = [];
  if (autoTxData.feeFunds > 0) {
    feeFunds = [{ denom: "utrst", amount: convertDenomToMicroDenom(autoTxData.feeFunds, 6).toString() }]
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
      feeFunds,
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
  feeFunds?: number
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