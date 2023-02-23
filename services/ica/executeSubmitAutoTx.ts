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
  if (autoTxData.startTime > 0) {
    startAt = (Math.floor(Date.now() / 1000) + autoTxData.startTime / 1000);
  }

  let duration = autoTxData.duration + "ms"
  let interval = autoTxData.interval + "ms"
  let msgs = []
  for (let msg of autoTxData.msgs) {
    console.log(msg)
    const masterRegistry = new Registry(msgRegistry);
    //let type = masterRegistry.lookupType((JSON.parse(autoTxData.msg)["typeUrl"]).toString())
    let value = JSON.parse(msg)["value"]

    let typeUrl: string = JSON.parse(msg)["typeUrl"].toString()

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
    console.log(encodeObject)

    let msgAny = masterRegistry.encodeAsAny(encodeObject)
    if (autoTxData.withAuthZ) {
      const encodeObject2 = {
        typeUrl: "/cosmos.authz.v1beta1.MsgExec",
        value: {
          msg,
          grantee: owner,
        }

      }
      msgAny = masterRegistry.encodeAsAny(encodeObject2)
    }
    console.log(msgAny)
    msgs.push(msgAny)
  }

  let feeFunds: Coin[] = [];
  if (autoTxData.feeFunds > 0) {
    feeFunds = [{ denom: "utrst", amount: convertDenomToMicroDenom(autoTxData.feeFunds, 6).toString() }]
  }
  console.log("label", autoTxData.label)
  return validateTransactionSuccess(
    await client.tx.auto_tx.submit_auto_tx({
      connectionId: autoTxData.connectionId ? autoTxData.connectionId : "",
      owner,
      msgs,
      label: autoTxData.label ? autoTxData.label : "",
      duration,
      interval,
      startAt: startAt.toString(),
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
  connectionId?: string
  dependsOnTxIds?: number[]
  msgs: string[]
  retries: number
  withAuthZ: boolean
  label?: string
  feeFunds?: number
}
